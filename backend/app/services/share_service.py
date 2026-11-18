# app/services/share_service.py
from datetime import datetime, timezone
from fastapi import HTTPException, BackgroundTasks

from app.db.session import AsyncSessionLocal as SessionLocal # 👈 عدّل المسار لو مختلف
from app.repositories.task_repo import TaskRepository
from app.repositories.user_repository import UserRepository
from app.repositories.taskShare_rep import TaskShareRepository
from app.services.permission_service import can_share_externally
from app.core.permissions import get_task_permissions, require_view_permission
from app.models import TaskShare
from app.services.notification_service import NotificationService
from app.services.log_service import LogService


# ============================================================
# Constants
# ============================================================
class ShareAction:
    GRANTED = "share_granted"
    REQUESTED = "share_requested"
    UPDATED = "share_updated"
    REVOKED = "share_revoked"


# ============================================================
# Background helpers (بياخدوا session خاص بيهم)
# ============================================================
async def _bg_notify(user_id, type_, title, msg, task_id):
    """إشعار في الخلفية مع session مستقل — عشان نتجنب مشكلة الـ db المقفولة."""
    try:
        async with SessionLocal() as db:
            await NotificationService.create(
                db, user_id, type_, title, msg, related_task_id=task_id
            )
            await db.commit()
    except Exception:
        # مفيش داعي نكسر الطلب — الـ notifications مش critical path
        pass


async def _bg_log(task_id, user_id, action, new_value=None, old_value=None):
    """تسجيل لوج في الخلفية مع session مستقل."""
    try:
        async with SessionLocal() as db:
            await LogService.log_action(
                db, task_id, user_id, action,
                new_value=new_value, old_value=old_value,
            )
            await db.commit()
    except Exception:
        pass


# ============================================================
# ShareService
# ============================================================
class ShareService:

    # --------------------------------------------------------
    # CREATE
    # --------------------------------------------------------
    @staticmethod
    async def share_task(db, data, current_user, background_tasks: BackgroundTasks):
        # 1) جلب المهمة والمستخدم المستهدف
        task = await TaskRepository.get_task_by_id(db, data.task_id, current_user)
        target_user = await UserRepository.get_user_with_relations(
            db, data.shared_with_user_id
        )
        if not task or not target_user:
            raise HTTPException(404, "المهمة أو المستخدم غير موجود")

        # 2) منع المشاركة مع النفس
        if data.shared_with_user_id == current_user.id:
            raise HTTPException(400, "لا يمكن مشاركة المهمة مع نفسك")

        # 3) التأكد من أن المستخدم المستهدف نشط
        if not target_user.is_active:
            raise HTTPException(400, "لا يمكن المشاركة مع مستخدم غير نشط")

        # 4) التحقق من الصلاحيات
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_share_add:
            raise HTTPException(403, "غير مصرح لك بالمشاركة")

        # 5) منع التكرار
        exists = await TaskShareRepository.CheckIfShare(
            db=db,
            task_id=data.task_id,
            shared_with_user_id=data.shared_with_user_id,
        )
        if exists:
            raise HTTPException(400, "المشاركة موجودة بالفعل")

        # 6) تقييم الحاجة للموافقة
        can_external, needs_approval = await can_share_externally(db, current_user, task)
        is_same_dept = (
            task.department_id is not None
            and task.department_id == target_user.department_id
        )

        if not can_external and not is_same_dept:
            raise HTTPException(403, "المشاركة الخارجية غير مسموحة")

        approval_needed = needs_approval and not is_same_dept

        # 7) التحقق من تاريخ الانتهاء
        if data.expires_at and data.expires_at <= datetime.now(timezone.utc):
            raise HTTPException(400, "تاريخ الانتهاء يجب أن يكون في المستقبل")

        # 8) التحقق من وجود مسؤول للموافقة
        approver_id = None
        if approval_needed:
            approver_id = current_user.manager_id
            if not approver_id and hasattr(UserRepository, "get_department_manager_id"):
                approver_id = await UserRepository.get_department_manager_id(
                    db, current_user.department_id
                )
            if not approver_id:
                raise HTTPException(
                    400,
                    "لا يوجد مسؤول للموافقة على المشاركة الخارجية",
                )

        # 9) الحفظ
        perm_value = data.permission.value
        share = TaskShare(
            task_id=data.task_id,
            shared_with_user_id=data.shared_with_user_id,
            permission=data.permission,
            shared_by=current_user.id,
            requires_approval=approval_needed,
            expires_at=data.expires_at,
            approval_status="pending" if approval_needed else "approved",
        )

        try:
            db.add(share)
            await db.flush()
            await db.commit()
        except Exception:
            await db.rollback()
            raise

        # 10) الإشعارات واللوج (background مع session جديد)
        if approval_needed:
            background_tasks.add_task(
                _bg_notify,
                approver_id,
                "external_share_requested",
                "طلب مشاركة خارجية",
                f"{current_user.full_name} يطلب مشاركة مهمة مع {target_user.full_name}",
                data.task_id,
            )
            background_tasks.add_task(
                _bg_log,
                data.task_id, current_user.id,
                ShareAction.REQUESTED,
                new_value=f"user:{data.shared_with_user_id} perm:{perm_value}",
            )
        else:
            background_tasks.add_task(
                _bg_notify,
                data.shared_with_user_id,
                "share_granted",
                "تمت مشاركة مهمة معك",
                f'تمت مشاركة مهمة "{task.title}" معك بصلاحية {perm_value}',
                data.task_id,
            )
            background_tasks.add_task(
                _bg_log,
                data.task_id, current_user.id,
                ShareAction.GRANTED,
                new_value=f"user:{data.shared_with_user_id} perm:{perm_value}",
            )

        return {
            "share_id": share.id,
            "requires_approval": approval_needed,
            "approval_status": share.approval_status,
            "message": (
                "تم إرسال طلب الموافقة للمدير"
                if approval_needed
                else "تمت المشاركة بنجاح"
            ),
        }

    # --------------------------------------------------------
    # READ
    # --------------------------------------------------------
    @staticmethod
    async def get_task_shares(
        db, task_id, current_user
    ):
        task = await TaskRepository.get_task_by_id(db, task_id, current_user)
        if not task:
            raise HTTPException(404, "المهمة غير موجودة")

        await require_view_permission(db, current_user, task)

        return await TaskShareRepository.get_shares_by_task_id(
            db, task_id 
        )

    # --------------------------------------------------------
    # UPDATE
    # --------------------------------------------------------
    @staticmethod
    async def update_share(
        db, share_id, data, current_user,
        background_tasks: BackgroundTasks,
    ):
        """
        تعديل مشاركة موجودة:
        - تغيير المستخدم المستهدف (shared_with_user_id)
        - تغيير الصلاحية (permission)
        - تغيير تاريخ الانتهاء (expires_at)
        """
        # 1) جلب المشاركة والمهمة
        record = await TaskShareRepository.get_share_with_task(db, share_id)
        if not record:
            raise HTTPException(404, "المشاركة غير موجودة")

        share, task = record

        # 2) التحقق من الصلاحيات
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_share_add:
            raise HTTPException(403, "غير مصرح لك بتعديل هذه المشاركة")

        # 3) القيم القديمة
        old_user_id = share.shared_with_user_id
        old_perm = share.permission
        old_expires = share.expires_at
        old_status = share.approval_status

        # 4) تحديد القيم الجديدة
        #    نستخدم model_fields_set عشان نفرّق بين:
        #    - الحقل مش مبعوت (نحتفظ بالقديم)
        #    - الحقل مبعوت بـ null صريح (نمسح القيمة، مثلاً expires_at)
        sent = getattr(data, "model_fields_set", set())

        new_user_id = data.shared_with_user_id or old_user_id
        new_perm = data.permission or old_perm
        new_expires = data.expires_at if "expires_at" in sent else old_expires

        # 5) التحقق من المستخدم الجديد
        target_user = await UserRepository.get_user_with_relations(db, new_user_id)
        if not target_user:
            raise HTTPException(404, "المستخدم غير موجود")
        if not target_user.is_active:
            raise HTTPException(400, "لا يمكن المشاركة مع مستخدم غير نشط")

        if new_user_id != old_user_id:
            if new_user_id == current_user.id:
                raise HTTPException(400, "لا يمكن مشاركة المهمة مع نفسك")

            exists = await TaskShareRepository.CheckIfShare(
                db=db,
                task_id=share.task_id,
                shared_with_user_id=new_user_id,
            )
            if exists:
                raise HTTPException(400, "المشاركة مع هذا المستخدم موجودة بالفعل")

        # 6) التحقق من تاريخ الانتهاء الجديد
        if (
            new_expires is not None
            and new_expires != old_expires
            and new_expires <= datetime.now(timezone.utc)
        ):
            raise HTTPException(400, "تاريخ الانتهاء يجب أن يكون في المستقبل")

        # 7) إعادة تقييم الحاجة للموافقة
        can_external, needs_approval = await can_share_externally(db, current_user, task)
        is_same_dept = (
            task.department_id is not None
            and task.department_id == target_user.department_id
        )

        if not can_external and not is_same_dept:
            raise HTTPException(403, "المشاركة الخارجية غير مسموحة")

        approval_needed = needs_approval and not is_same_dept

        # 8) تحديد approver لو محتاج موافقة
        approver_id = None
        if approval_needed:
            approver_id = current_user.manager_id
            if not approver_id and hasattr(UserRepository, "get_department_manager_id"):
                approver_id = await UserRepository.get_department_manager_id(
                    db, current_user.department_id
                )
            if not approver_id:
                raise HTTPException(400, "لا يوجد مسؤول للموافقة على المشاركة الخارجية")

        # 9) تحديد الحالة الجديدة
        if approval_needed:
            new_status = "pending"
        else:
            new_status = "approved" if old_status == "pending" else old_status

        # 10) تطبيق التعديلات
        share.shared_with_user_id = new_user_id
        share.permission = new_perm
        share.expires_at = new_expires
        share.requires_approval = approval_needed
        share.approval_status = new_status

        try:
            await db.flush()
            await db.commit()
        except Exception:
            await db.rollback()
            raise

        # 11) تجهيز الفروقات للتسجيل
        changes = []
        if new_user_id != old_user_id:
            changes.append(f"user:{old_user_id}->{new_user_id}")
        if new_perm.value != old_perm.value:
            changes.append(f"perm:{old_perm.value}->{new_perm.value}")
        if new_expires != old_expires:
            changes.append(f"expires:{old_expires}->{new_expires}")
        if new_status != old_status:
            changes.append(f"status:{old_status}->{new_status}")

        # 12) الإشعارات
        # أ) المستخدم القديم لو تغيّر → إلغاء وصول
        if new_user_id != old_user_id:
            background_tasks.add_task(
                _bg_notify,
                old_user_id,
                "share_revoked",
                "تم إلغاء مشاركة",
                f'تم إلغاء وصولك لمهمة "{task.title}"',
                share.task_id,
            )

        # ب) لو محتاجة موافقة → إشعار المدير
        if approval_needed:
            background_tasks.add_task(
                _bg_notify,
                approver_id,
                "external_share_requested",
                "طلب مشاركة خارجية",
                f"{current_user.full_name} يطلب مشاركة مهمة مع {target_user.full_name}",
                share.task_id,
            )
        elif changes:
            # ج) إشعار المستخدم المستهدف بالتحديث
            background_tasks.add_task(
                _bg_notify,
                new_user_id,
                "share_updated",
                "تم تحديث مشاركة مهمة",
                f'تم تحديث مشاركتك في مهمة "{task.title}" بصلاحية {new_perm.value}',
                share.task_id,
            )

        # 13) اللوج
        background_tasks.add_task(
            _bg_log,
            share.task_id, current_user.id,
            ShareAction.REQUESTED if approval_needed else ShareAction.UPDATED,
            new_value=" ".join(changes) if changes else "no_change",
            old_value=f"user:{old_user_id} perm:{old_perm.value} expires:{old_expires}",
        )

        return {
            "share_id": share.id,
            "requires_approval": approval_needed,
            "approval_status": new_status,
            "message": (
                "تم تحديث المشاركة بنجاح"
                if not approval_needed
                else "تم تحديث المشاركة وهي بانتظار موافقة المدير"
            ),
        }

    # --------------------------------------------------------
    # REVOKE
    # --------------------------------------------------------
    @staticmethod
    async def revoke_share(
        db, share_id, current_user,
        background_tasks: BackgroundTasks = None,
    ):
        # 1) جلب المشاركة والمهمة
        record = await TaskShareRepository.get_share_with_task(db, share_id)
        if not record:
            raise HTTPException(404, "المشاركة غير موجودة")

        share, task = record

        # 2) التحقق من الصلاحية
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_share_remove:
            raise HTTPException(403, "غير مصرح لك بإلغاء هذه المشاركة")

        # 3) حفظ البيانات للوج والإشعار قبل الحذف
        old_user_id = share.shared_with_user_id
        old_perm_value = share.permission.value

        # 4) الحذف
        try:
            await TaskShareRepository.delete_share(db, share)
            await db.commit()
        except Exception:
            await db.rollback()
            raise

        # 5) إشعار ولوج
        if background_tasks:
            background_tasks.add_task(
                _bg_notify,
                old_user_id,
                "share_revoked",
                "تم إلغاء مشاركة",
                f'تم إلغاء وصولك لمهمة "{task.title}"',
                task.id,
            )
            background_tasks.add_task(
                _bg_log,
                task.id, current_user.id,
                ShareAction.REVOKED,
                old_value=f"user:{old_user_id} perm:{old_perm_value}",
            )

        return {"message": "تم إلغاء المشاركة"}