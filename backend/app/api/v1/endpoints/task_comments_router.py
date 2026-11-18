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
from app.services.task_comment_service import CommentService

from app.services.notification_service import NotificationService
from app.schemas.base import get_task_or_404,apply_pagination
from app.schemas.comments import CommentOut
NOWTIME=datetime.now().replace(tzinfo=None)
router = APIRouter(prefix="/comments", tags=["comments - تعليقات المهام"])
class CommentCreate(BaseModel):
    comment_text: str
@router.post("/{task_id}", status_code=201)
async def add_comment(
    task_id: int,
    payload: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    إضافة تعليق وإرساله فوراً عبر الـ WebSocket للمشاركين والمنفذين بداخل المهمة.
    - الصلاحية: أي مستخدم له علاقة بالمهمة (can_add_comment)
    """
    return await CommentService.add_comment(db,task_id,payload.comment_text,current_user)
  

@router.get("/{task_id}")
async def get_comments(
    task_id: int,
    page: int = Query(1, ge=1, description="رقم الصفحة الحالية"),
    limit: int = Query(20, ge=1, le=50, description="عدد التعليقات في الصفحة الواحدة"),
    search: Optional[str] = Query(None, description="بحث باسم المستخدم"),
    from_date: Optional[datetime] = Query(None, description="من تاريخ/وقت (ISO 8601)"),
    to_date: Optional[datetime] = Query(None, description="إلى تاريخ/وقت (ISO 8601)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    جلب كافة التعليقات والنقاشات المرتبطة بالمهمة مرتبة من الأقدم إلى الأحدث
    """
    return await CommentService.list_comments(db, task_id,page,limit,current_user,
        search=search, from_date=from_date, to_date=to_date,)


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
