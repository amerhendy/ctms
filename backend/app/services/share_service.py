#app/services/share_service.py
from fastapi import HTTPException,BackgroundTasks
from app.repositories.task_repo import TaskRepository
from app.repositories.user_repository import UserRepository
from app.repositories.taskShare_rep import TaskShareRepository
from app.services.permission_service import can_share_externally
from app.core.permissions import get_task_permissions, require_view_permission
from app.models import (TaskShare)
from app.services.notification_service import NotificationService
from app.services.log_service import LogService
class ShareService:
    @staticmethod
    async def share_task(db, data, current_user, background_tasks):
        # 1. جلب المهمة والمستخدم المستهدف
        task = await TaskRepository.get_task_by_id(db, data.task_id, current_user)
        target_user = await UserRepository.get_user_with_relations(db, data.shared_with_user_id)
        
        if not task or not target_user:
            raise HTTPException(404, "المهمة أو المستخدم غير موجود")

        # 2. التحقق من الصلاحيات (استخدام الخدمة الموحدة)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_share_add:
            raise HTTPException(403, "غير مصرح لك بالمشاركة")

        #check if there was share for same 
        exists=await TaskShareRepository.CheckIfShare(db=db,task_id=data.task_id,shared_with_user_id=data.shared_with_user_id)
        if exists:
            raise HTTPException(400, "المشاركة موجودة بالفعل")
        
        # 3. منطق العمل: هل نحتاج موافقة؟
        _, needs_approval = await can_share_externally(db, current_user, task)
        is_same_dept = (task.department_id == target_user.department_id)
        approval_needed = needs_approval and not is_same_dept
        
        expireDate=None
        if data.expires_at:
            expireDate=data.expires_at
        # 4. حفظ المشاركة
        share = TaskShare(
            task_id=data.task_id,
            shared_with_user_id=data.shared_with_user_id,
            permission=data.permission,
            shared_by=current_user.id,
            requires_approval=approval_needed,
            expires_at=expireDate,
            approval_status="pending" if approval_needed else "approved"
        )
        db.add(share)
        await db.flush()

        # 5. إشعارات ولـوغ (في الخلفية لسرعة الأداء)
        if approval_needed and current_user.manager_id:
            background_tasks.add_task(
                NotificationService.create,
                db, current_user.manager_id,
                "external_share_requested",
                "طلب مشاركة خارجية",
                f'{current_user.full_name} يطلب مشاركة مهمة مع {target_user.full_name}',
                related_task_id=data.task_id,
                )
        else:
            background_tasks.add_task(
                NotificationService.create,
                db, data.shared_with_user_id,
                "share_granted",
                "تمت مشاركة مهمة معك",
                f'تمت مشاركة مهمة "{task.title}" معك بصلاحية {data.permission.value}',
                related_task_id=data.task_id,
                )
        background_tasks.add_task(
            LogService.log_action,
            db, task.id, current_user.id, "share_granted",
            new_value=f"user:{data.shared_with_user_id} perm:{data.permission.value}"
            )

        await db.commit()
        return {
            "share_id": share.id,
            "requires_approval": approval_needed,
            "message": "تم إرسال طلب الموافقة للمدير" if approval_needed else "تمت المشاركة بنجاح",
        }

    @staticmethod
    async def get_task_shares(db, task_id, current_user):
        # 1. جلب المهمة (استخدام الـ Repo)
        task = await TaskRepository.get_task_by_id(db, task_id, current_user)
        if not task:
            raise HTTPException(404, "المهمة غير موجودة")
            
        # 2. التحقق من الصلاحيات
        await require_view_permission(db, current_user, task)
        
        # 3. جلب المشاركات من الـ Repo
        return await TaskShareRepository.get_shares_by_task_id(db, task_id)
    
    @staticmethod
    async def revoke_share(db, share_id, current_user):
        # 1. جلب المشاركة والمهمة معاً
        record = await TaskShareRepository.get_share_with_task(db, share_id)
        if not record:
            raise HTTPException(404, "المشاركة غير موجودة")
        
        share, task = record

        # 2. التحقق من الصلاحية
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_share_remove:
            raise HTTPException(403, "غير مصرح لك بإلغاء هذه المشاركة")

        # 3. تسجيل الحدث
        await LogService.log_action(db, share.task_id, current_user.id, "share_revoked",
                                    old_value=f"user:{share.shared_with_user_id}")

        # 4. الحذف
        await TaskShareRepository.delete_share(db, share)
        await db.commit()
        return {"message": "تم إلغاء المشاركة"}