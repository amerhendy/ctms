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
from app.schemas.task_comment_sch import CommentOut

from app.services.task_comment_service import CommentService
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
    return await CommentService.add_comment(db,task_id,comment_text,current_user)

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
    return await CommentService.list_comments(db,task_id,page,limit,current_user)
    

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
    return await CommentService.update_comment(db,task_id,comment_id,comment_text,current_user)


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
    return await CommentService.delete_comment(db,task_id,comment_id,current_user)
    
