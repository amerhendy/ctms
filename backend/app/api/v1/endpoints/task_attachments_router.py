import os
import shutil
from fastapi import UploadFile, File, Request
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field,field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload, with_loader_criteria
from typing import Optional, List
from datetime import datetime, time
from app.db.session import get_db
from app.models import (User, Task, TaskAttachment)

from app.core.security import get_current_user
from app.core.permissions import require_view_permission, get_task_permissions
from app.services.log_service import LogService
from app.schemas.base import get_task_or_404,apply_pagination

from app.services.task_attachment_service import AttachmentService
router = APIRouter(prefix="/taskAttachments", tags=["Tasks Attachments - ملفات المهام"])
UPLOAD_DIR = os.getenv("TASK_ATTACHMENT_DIR", "storage/attachments")
MAX_FILE_SIZE = 10 * 1024 * 1024
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {
    # صور
    'jpg', 'jpeg', 'png', 'gif', 
    # مستندات وورد قديم وجديد
    'pdf', 'doc', 'docx', 
    # إكسل وجداول بيانات
    'xls', 'xlsx', 'csv', 
    # باوربوينت
    'ppt', 'pptx', 
    # أكسس
    'mdb', 'accdb', 
    # نصوص وقواعد بيانات
    'txt', 'sql', 
    # ملفات مضغوطة
    'zip', 'rar',
    'dwg', 'dxf', 'stl', 'step', 'iges',  # ملفات التصميم الهندسي
}
NOWTIME=datetime.now().replace(tzinfo=None)
@router.get("/{task_id}")
async def get_attachments(
    task_id: int,
    page: int = Query(1, ge=1, description="رقم الصفحة الحالية"),
    limit: int = Query(20, ge=1, le=50, description="عدد الملفات في الصفحة الواحدة"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    جلب قائمة المرفقات - قفل الحماية: متاح فقط لفريق العمل المعين على هذه المهمة أو منشئها أو الأدمن
    """
    return await AttachmentService.list_attachments(db,task_id,page,limit,current_user)

@router.post("/{task_id}", status_code=201)
async def add_attachment(
    task_id: int,
    file: UploadFile = File(..., description="الملف المراد رفعه للمهمة"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AttachmentService.add_attachment(db,task_id,file,current_user)
    


@router.delete("/{task_id}/{attach_id}")
async def delete_attachment(
    task_id: int,
    attach_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AttachmentService.delete_attachment(db,task_id,attach_id,current_user)

@router.get("/{task_id}/{attach_id}/getItem")
async def download_attachment(
    task_id: int,
    attach_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AttachmentService.download_attachment(db,task_id,attach_id,current_user)