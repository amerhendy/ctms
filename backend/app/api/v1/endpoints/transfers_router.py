#api/v1/endpoints/transfers.py
"""
Task Transfers API – Enforces same-level administrative transfer rule.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import List

from app.db.session import get_db
from app.db.enums import GlobalRole, TransferStatus
from app.models import (
    User, Task, TaskTransfer, Department
)
from app.schemas.transfers import TransferCreate, TransferAction, TaskTransferOut
from app.core.security import get_current_user
from app.services.permission_service import can_transfer_task
from app.services.log_service import LogService
from app.services.notification_service import NotificationService
from app.core.permissions import get_task_permissions, require_view_permission
from datetime import timezone
from app.core.permissions import AccessService
router = APIRouter(prefix="/transfers", tags=["Task Transfers"])


@router.post("", status_code=201)
async def create_transfer(
    data: TransferCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إرسال مهمة إلى قسم آخر (نفس المستوى الإداري فقط)."""
    # جلب المهمة
    result = await db.execute(select(Task).where(Task.id == data.task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "المهمة غير موجودة")

    # جلب المستخدم المستهدف
    result = await db.execute(select(User).where(User.id == data.to_user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(404, "المستخدم المستهدف غير موجود")

    # استخدام نظام الصلاحيات الجديد للتحقق من صلاحية نقل المهمة
    perms = await get_task_permissions(db, current_user, task)
    if not perms.can_transfer_task:
        raise HTTPException(403, "غير مصرح لك بنقل هذه المهمة")

    # التحقق الإضافي من قاعدة "نفس المستوى الإداري" (اختياري، يمكن تركه)
    # إذا كانت الدالة القديمة can_transfer_task تحتوي على منطق معقد، يمكن استدعاؤها هنا أيضاً.
    # لكننا نعتمد أساساً على perms.can_transfer_task.

    # جلب أسماء الأقسام للإشعارات
    result_from = await db.execute(
        select(Department).where(Department.id == task.department_id)
    )
    from_dept = result_from.scalar_one_or_none()

    result_to = await db.execute(
        select(Department).where(Department.id == data.to_department_id)
    )
    to_dept = result_to.scalar_one_or_none()

    # التحقق من وجود طلب تحويل معلق لهذه المهمة
    existing = await db.execute(
        select(TaskTransfer).where(
            TaskTransfer.task_id == data.task_id,
            TaskTransfer.status == TransferStatus.PENDING,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "يوجد طلب تحويل معلق بالفعل لهذه المهمة")

    transfer = TaskTransfer(
        task_id=data.task_id,
        from_department_id=task.department_id,
        to_department_id=data.to_department_id,
        from_user_id=current_user.id,
        to_user_id=data.to_user_id,
        transfer_note=data.transfer_note,
        status=TransferStatus.PENDING,
    )
    db.add(transfer)
    await db.flush()

    await LogService.log_action(
        db, task.id, current_user.id, "transferred",
        old_value=from_dept.name if from_dept else str(task.department_id),
        new_value=to_dept.name if to_dept else str(data.to_department_id),
        extra_data=f"طلب تحويل بواسطة {current_user.full_name}"
    )

    await NotificationService.notify_task_transfer(
        db,
        task_id=task.id,
        task_title=task.title,
        from_user_id=current_user.id,
        to_user_id=data.to_user_id,
        from_dept_name=from_dept.name if from_dept else "غير محدد",
        to_dept_name=to_dept.name if to_dept else "غير محدد",
    )

    return {"transfer_id": transfer.id, "message": "تم إرسال طلب التحويل"}


@router.get("/pending")
async def get_pending_transfers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get transfers directed to current user."""
    result = await db.execute(
        select(TaskTransfer)
        .options(
            selectinload(TaskTransfer.task),
            selectinload(TaskTransfer.from_user),
            selectinload(TaskTransfer.from_department),
            selectinload(TaskTransfer.to_department),
        )
        .where(
            TaskTransfer.to_user_id == current_user.id,
            TaskTransfer.status == TransferStatus.PENDING,
        )
        .order_by(TaskTransfer.created_at.desc())
    )
    transfers = result.scalars().all()
    return [
        {
            "id": t.id,
            "task_id": t.task_id,
            "task_title": t.task.title if t.task else None,
            "from_user_id": t.from_user_id,
            "from_user_name": t.from_user.full_name if t.from_user else None,
            "from_department": t.from_department.name if t.from_department else None,
            "to_department": t.to_department.name if t.to_department else None,
            "transfer_note": t.transfer_note,
            "created_at": t.created_at.isoformat(),
        }
        for t in transfers
    ]


@router.post("/{transfer_id}/respond")
async def respond_to_transfer(
    transfer_id: int,
    data: TransferAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """قبول أو رفض طلب تحويل وارد بناءً على صلاحيات المديرين والمستوى الإداري."""
    
    # 1. جلب التحويل مع المهمة والمستخدمين المعنيين بالعملية
    result = await db.execute(
        select(TaskTransfer)
        .options(
            selectinload(TaskTransfer.task)
        )
        .where(TaskTransfer.id == transfer_id)
    )
    transfer = result.scalar_one_or_none()
    if not transfer:
        raise HTTPException(404, "التحويل غير موجود")

    if transfer.status != TransferStatus.PENDING:
        raise HTTPException(400, f"التحويل في حالة: {transfer.status.value}")

    # 2. جلب بيانات الموظف المحول إليه والموظف المُحوِّل بالكامل (لمعرفة مديريهم)
    res_to_user = await db.execute(select(User).where(User.id == transfer.to_user_id))
    target_user = res_to_user.scalar_one_or_none() # الموظف المستهدف بالتحويل

    res_from_user = await db.execute(select(User).where(User.id == transfer.from_user_id))
    sender_user = res_from_user.scalar_one_or_none() # الموظف اللي عمل التحويل

    if not target_user or not sender_user:
        raise HTTPException(404, "أحد أطراف عملية التحويل غير موجود")

    # ------------------------------------------------------------------
    # 🔒 نظام فحص صلاحيات متخذ القرار (اللوجيك الجديد)
    # ------------------------------------------------------------------
    is_authorized = False

    # الاستثناء أ: الأدمن العام أو رئيس مجلس الإدارة له حق القرار دائماً
    if AccessService._is_global_admin(current_user):
        is_authorized = True

    # الاستثناء ب: إذا كان المدير المباشر للموظف المستهدف هو رئيس مجلس الإدارة/الأدمن، يُسمح للموظف بالقبول بنفسه
    elif target_user.manager_id is None and current_user.id == target_user.id:
        # إذا ملوش مدير في السيستم (هو رأس الهرم الإداري) أو مديره الأدمن، يقبل بنفسه
        is_authorized = True

    # الحالة 1: المدير المباشر للموظف المستهدف هو اللي بيوافق حالياً
    elif current_user.id == target_user.manager_id:
        is_authorized = True

    # الحالة 2: المدير محوّل لموظفه مباشرة -> الموظف مسموح له يقبل أمر مديره
    elif sender_user.id == target_user.manager_id and current_user.id == target_user.id:
        is_authorized = True

    # الحالة 3: الموظفين (المُرسل والمستقبل) تحت إدارة نفس المدير -> لازم المدير المشترك هو اللي يوافق
    elif sender_user.manager_id == target_user.manager_id and target_user.manager_id is not None:
        if current_user.id == target_user.manager_id:
            is_authorized = True
        else:
            raise HTTPException(403, "يجب موافقة المدير المشترك لكما لإتمام التحويل")

    # إذا لم يطابق أي شرط من شروط الإدارة الإشرافية
    if not is_authorized:
        raise HTTPException(403, "ليس لديك الصلاحية الإدارية للرد على هذا التحويل (الموافقة من صلاحية المدير المباشر)")

    # ------------------------------------------------------------------
    # 💾 تنفيذ عملية القبول أو الرفض وتحديث البيانات
    # ------------------------------------------------------------------
    task = transfer.task

    if data.status == TransferStatus.ACCEPTED:
        transfer.status = TransferStatus.ACCEPTED
        transfer.resolved_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # تحديث قسم المهمة إلى القسم الجديد
        task.department_id = transfer.to_department_id
        action = "transfer_accepted"

        await LogService.log_action(
            db, task.id, current_user.id, "transfer_accepted",
            new_value=f"قبول بواسطة {current_user.full_name}",
            extra_data=f"تم نقل المهمة إلى قسم {transfer.to_department_id}"
        )

    elif data.status == TransferStatus.REJECTED:
        if not data.rejection_reason:
            raise HTTPException(400, "يجب إدخال سبب الرفض")
        transfer.status = TransferStatus.REJECTED
        transfer.rejection_reason = data.rejection_reason
        transfer.resolved_at = datetime.now(timezone.utc).replace(tzinfo=None)
        action = "transfer_rejected"

        await LogService.log_action(
            db, task.id, current_user.id, "transfer_rejected",
            new_value=f"رفض: {data.rejection_reason}",
            extra_data=f"رفض بواسطة {current_user.full_name}"
        )
    else:
        raise HTTPException(400, "الإجراء غير صحيح")

    # إرسال الإشعارات بالرد
    await NotificationService.notify_transfer_response(
        db,
        task_id=task.id,
        task_title=task.title,
        from_user_id=transfer.from_user_id,
        to_user_id=target_user.id, # صاحب الشأن الأصلي
        accepted=(data.status == TransferStatus.ACCEPTED),
        reason=data.rejection_reason,
    )

    # حفظ وتحديث الكاش لتجنب الـ MissingGreenlet الـ Lazy load
    await db.commit()
    await db.refresh(current_user, ["job_level"])

    return {"message": "تم القبول بنجاح" if data.status == TransferStatus.ACCEPTED else "تم الرفض"}


@router.get("/history/{task_id}")
async def get_transfer_history(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """جلب تاريخ تحويلات مهمة معينة (يتطلب صلاحية عرض المهمة)."""
    # جلب المهمة للتحقق من الصلاحية
    result_task = await db.execute(select(Task).where(Task.id == task_id))
    task = result_task.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "المهمة غير موجودة")

    # التحقق من صلاحية العرض
    await require_view_permission(db, current_user, task)

    # جلب سجل التحويلات
    result = await db.execute(
        select(TaskTransfer)
        .options(
            selectinload(TaskTransfer.from_user),
            selectinload(TaskTransfer.to_user),
            selectinload(TaskTransfer.from_department),
            selectinload(TaskTransfer.to_department),
        )
        .where(TaskTransfer.task_id == task_id)
        .order_by(TaskTransfer.created_at.desc())
    )
    transfers = result.scalars().all()
    return [
        {
            "id": t.id,
            "from_user": t.from_user.full_name if t.from_user else None,
            "to_user": t.to_user.full_name if t.to_user else None,
            "from_department": t.from_department.name if t.from_department else None,
            "to_department": t.to_department.name if t.to_department else None,
            "status": t.status.value,
            "rejection_reason": t.rejection_reason,
            "transfer_note": t.transfer_note,
            "created_at": t.created_at.isoformat(),
            "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
        }
        for t in transfers
    ]