import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload, with_loader_criteria
from typing import Optional, List
from datetime import datetime, time
from app.db.session import get_db
from app.models import (User, Task, TaskAssignment, TaskShare,TaskComment) 
from app.core.security import get_current_user
from app.core.permissions import require_view_permission, get_task_permissions
from app.core.utils import logger
from app.services.log_service import LogService

from app.services.notification_service import NotificationService
from app.schemas.base import get_task_or_404,apply_pagination
from app.schemas.comments import CommentOut
NOWTIME=datetime.now().replace(tzinfo=None)
router = APIRouter(prefix="/comments", tags=["comments - تعليقات المهام"])
@router.post("/{task_id}", status_code=201)
async def add_comment(
    task_id: int,
    comment_text: str = Query(..., description="نص التعليق المراد إضافته للمهمة"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    إضافة تعليق وإرساله فوراً عبر الـ WebSocket للمشاركين والمنفذين بداخل المهمة.
    - الصلاحية: أي مستخدم له علاقة بالمهمة (can_add_comment)
    """
    task = await get_task_or_404(db, task_id)
    
    # التحقق من صلاحية إضافة تعليق
    perms = await get_task_permissions(db, current_user, task)
    if not perms.can_add_comment:
        raise HTTPException(403, "غير مصرح لك بإضافة تعليق بداخل هذه المهمة")
        
    comment = TaskComment(
        task_id=task_id,
        user_id=current_user.id,
        comment_text=comment_text
    )
    db.add(comment)
    await db.flush()
    
    # توثيق العملية في السجل
    await LogService.log_action(db, task_id, current_user.id, "comment_added", new_value=f"comment_id:{comment.id}")
    
    # تجميع المستخدمين المستهدفين بالإشعارات (منشئ، منفذون، مشاركون)
    recipients = set()
    
    if task.created_by != current_user.id:
        recipients.add(task.created_by)
    
    # استخدام العلاقات المحملة إذا كانت موجودة، وإلا استعلام
    if hasattr(task, 'assignments') and task.assignments:
        for assignment in task.assignments:
            if assignment.user_id != current_user.id:
                recipients.add(assignment.user_id)
    else:
        assignees_result = await db.execute(
            select(TaskAssignment.user_id).where(TaskAssignment.task_id == task_id)
        )
        for uid in assignees_result.scalars().all():
            if uid != current_user.id:
                recipients.add(uid)
    
    if hasattr(task, 'shares') and task.shares:
        for share in task.shares:
            if share.shared_with_user_id != current_user.id:
                recipients.add(share.shared_with_user_id)
    else:
        shares_result = await db.execute(
            select(TaskShare.shared_with_user_id).where(TaskShare.task_id == task_id)
        )
        for uid in shares_result.scalars().all():
            if uid != current_user.id:
                recipients.add(uid)

    # إعداد payload WebSocket
    comment_payload = {
        "event": "comment_created",
        "task_id": task_id,
        "comment": {
            "id": comment.id,
            "comment_text": comment.comment_text,
            "user_id": current_user.id,
            "user_name": current_user.full_name,
            "created_at": NOWTIME.isoformat()
        }
    }

    # إرسال الإشعارات والبث
    for user_id in recipients:
        await NotificationService.create(
            db, user_id, "new_comment",
            "تعليق جديد على المهمة",
            f'قام الموظف {current_user.full_name} بإضافة تعليق جديد على مهمة تشترك بها "{task.title}"',
            related_task_id=task_id
        )
        
        try:
            if hasattr(ws_manager, "send_personal_message"):
                await ws_manager.send_personal_message(comment_payload, user_id)
            elif hasattr(ws_manager, "broadcast"):
                await ws_manager.broadcast(comment_payload)
        except Exception as e:
            logger.debug(f"Failed to send WS message to user {user_id}: {e}")
        
    await db.commit()
    return {"id": comment.id, "message": "تمت إضافة التعليق وبثه فوراً للمشاركين"}

@router.get("/{task_id}")
async def get_comments(
    task_id: int,
    page: int = Query(1, ge=1, description="رقم الصفحة الحالية"),
    limit: int = Query(20, ge=1, le=50, description="عدد التعليقات في الصفحة الواحدة"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    جلب كافة التعليقات والنقاشات المرتبطة بالمهمة مرتبة من الأقدم إلى الأحدث
    """
    task = await get_task_or_404(db, task_id)
    perms = await require_view_permission(db, current_user, task)
    base_query = (
        select(TaskComment)
        .where(TaskComment.task_id == task_id)
        .order_by(TaskComment.created_at.asc())
    )
    paginated_result = await apply_pagination(
        db=db,
        base_query=base_query,
        model_class=CommentOut, # الكلاس المطلوب للمحرك الفني
        page=page,
        page_size=limit
    )
    paginated_result["items"] = [CommentOut.from_orm(c) for c in paginated_result.get("items", [])]
    
    paginated_result["has_more"] = page < paginated_result.get("pages", 1)

    return paginated_result


@router.patch("/{task_id}/{comment_id}")
async def update_comment(
    task_id: int,
    comment_id: int,
    comment_text: str = Query(..., description="النص الجديد المحدث للتعليق"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    تعديل تعليق سابق.
    - الصلاحية: صاحب التعليق، أو الأدمن العام، أو مدير البرنامج (can_edit_comment)
    """
    # التحقق من وجود المهمة (مع العلاقات)
    task = await get_task_or_404(db, task_id)
    
    # جلب التعليق
    result = await db.execute(
        select(TaskComment).where(TaskComment.id == comment_id, TaskComment.task_id == task_id)
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(404, "التعليق غير موجود")
    
    # حساب صلاحيات المستخدم على المهمة
    perms = await get_task_permissions(db, current_user, task)
    
    # التحقق من صلاحية تعديل هذا التعليق
    if not perms.can_edit_comment(comment.user_id, current_user.id):
        raise HTTPException(403, "غير مصرح! لا يمكنك تعديل هذا التعليق")
    
    # تطبيق التعديل
    comment.comment_text = comment_text
    comment.updated_at = NOWTIME
    
    # تسجيل العملية
    await LogService.log_action(
        db, task_id, current_user.id, "comment_updated",
        new_value=f"comment_id:{comment_id}",
        extra_data=f"تم تعديل التعليق بواسطة {current_user.full_name}"
    )
    await db.commit()
    return {"message": "تم تعديل التعليق بنجاح"}


@router.delete("/{task_id}/{comment_id}")
async def delete_comment(
    task_id: int,
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    حذف تعليق.
    - الصلاحية: الأدمن العام، مدير البرنامج، أو صاحب التعليق نفسه.
    """
    task = await get_task_or_404(db, task_id)
    
    result = await db.execute(
        select(TaskComment).where(TaskComment.id == comment_id, TaskComment.task_id == task_id)
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(404, "التعليق غير موجود")
    
    # حساب صلاحيات المستخدم
    perms = await get_task_permissions(db, current_user, task)
    
    # التحقق من صلاحية حذف التعليق
    if not perms.can_delete_comment(comment.user_id, current_user.id):
        raise HTTPException(403, "غير مصرح! لا يمكنك حذف هذا التعليق")
    
    await db.delete(comment)
    await LogService.log_action(
        db, task_id, current_user.id, "comment_deleted",
        old_value=f"comment_id:{comment_id}",
        extra_data=f"تم حذف التعليق بواسطة {current_user.full_name}"
    )
    await db.commit()
    return {"message": "تم حذف التعليق بنجاح"}
