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

@router.post("/{task_id}", status_code=201)
async def add_attachment(
    task_id: int,
    file: UploadFile = File(..., description="الملف المراد رفعه للمهمة"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    رفع ملف مرفق جديد.
    - الصلاحية: أي مستخدم له علاقة بالمهمة (can_add_attachment)
    """
    task = await get_task_or_404(db, task_id)
    
    # التحقق من صلاحية إضافة مرفق
    perms = await get_task_permissions(db, current_user, task)
    if not perms.can_add_attachment:
        raise HTTPException(403, "غير مصرح لك برفع مرفقات لهذه المهمة")
    
    # التحقق من حجم الملف قبل قراءته
    file.file.seek(0, 2)  # انتقل إلى نهاية الملف
    size = file.file.tell()
    if size > MAX_FILE_SIZE:
        raise HTTPException(400, f"الملف كبير جداً (الحد الأقصى {MAX_FILE_SIZE // (1024*1024)} ميجابايت)")
    await file.seek(0)  # إعادة المؤشر للبداية
    
    # التحقق من امتداد الملف
    file_extension = os.path.splitext(file.filename)[1].lower().lstrip('.')
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "نوع الملف غير مسموح به")
    
    # توليد اسم فريد للملف
    unique_filename = f"task_{task_id}_{NOWTIME.timestamp()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # حفظ الملف
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size_bytes = os.path.getsize(file_path)
    
    attachment = TaskAttachment(
        task_id=task_id,
        user_id=current_user.id,
        file_name=file.filename,
        file_path=file_path,
        file_size=file_size_bytes,
        mime_type=file.content_type
    )
    db.add(attachment)
    await LogService.log_action(db, task_id, current_user.id, "attachment_added", new_value=file.filename)
    await db.commit()
    
    return {"message": "تم رفع الملف بنجاح", "attachment_id": attachment.id}


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
    task = await get_task_or_404(db, task_id)
    perms = await require_view_permission(db, current_user, task)
    if not perms.can_view_attachment:
        raise HTTPException(403, "غير مصرح لك برؤية المرفقات")
    base_query = (select(TaskAttachment).where(TaskAttachment.task_id == task_id).order_by(TaskAttachment.created_at.desc()))
    paginated_result = await apply_pagination(
        db=db,
        base_query=base_query,
        model_class=TaskAttachment, # الكلاس المطلوب للمحرك الفني
        page=page,
        page_size=limit
    )
    paginated_result["has_more"] = page < paginated_result.get("pages", 1)
    formatted_items = []
    for att in paginated_result["items"]:
        formatted_items.append({
            "id": att.id,
            "file_name": att.file_name,
            "file_path": att.file_path,
            "file_size": att.file_size,
            "mime_type": att.mime_type,
            "created_at": att.created_at.isoformat()
        })

    # 🌟 7. إرجاع نفس القاموس المتفق عليه والموحد للنظام بالكامل
    return {
        "total": paginated_result["total"],
        "page": paginated_result["page"],
        "page_size": paginated_result["page_size"],
        "pages": paginated_result["pages"], # الحقل الجديد اللي مكنش بيطلع!
        "has_more":paginated_result["has_more"],
        "items": formatted_items,
    }


@router.delete("/{task_id}/{attach_id}")
async def delete_attachment(
    task_id: int,
    attach_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    حذف ملف مرفق.
    - الصلاحية: مدير البرنامج أو منشئ الملف (can_delete_attachment)
    """
    task = await get_task_or_404(db, task_id)
    
    result = await db.execute(
        select(TaskAttachment).where(TaskAttachment.id == attach_id, TaskAttachment.task_id == task_id)
    )
    attachment = result.scalar_one_or_none()
    if not attachment:
        raise HTTPException(404, "المرفق غير موجود")
    
    # حساب الصلاحيات
    perms = await get_task_permissions(db, current_user, task)
    if not perms.can_delete_attachment(attachment.user_id, current_user.id):
        raise HTTPException(403, "غير مصرح لك بحذف هذا المرفق")
    
    # حذف الملف الفعلي من القرص
    if os.path.exists(attachment.file_path):
        os.remove(attachment.file_path)
    
    await db.delete(attachment)
    await LogService.log_action(
        db, task_id, current_user.id, "attachment_deleted",
        old_value=attachment.file_name,
        extra_data=f"تم حذف المرفق بواسطة {current_user.full_name}"
    )
    await db.commit()
    return {"message": "تم حذف الملف المرفق بنجاح"}

@router.get("/{task_id}/{attach_id}/getItem")
async def download_attachment(
    task_id: int,
    attach_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """تحميل ملف مرفق مع التحقق من صلاحية العرض."""
    # التحقق من وجود المهمة وصلاحية المستخدم
    task = await get_task_or_404(db, task_id)
    await require_view_permission(db, current_user, task)

    # جلب المرفق
    result = await db.execute(
        select(TaskAttachment).where(
            TaskAttachment.id == attach_id,
            TaskAttachment.task_id == task_id
        )
    )
    attachment = result.scalar_one_or_none()
    if not attachment:
        raise HTTPException(404, "الملف غير موجود")

    # التحقق من وجود الملف على الخادم
    if not os.path.exists(attachment.file_path):
        raise HTTPException(404, "الملف غير موجود على الخادم")

    # إعادة الملف مع اسمه الأصلي
    return FileResponse(
        path=attachment.file_path,
        filename=attachment.file_name,
        media_type=attachment.mime_type or "application/octet-stream"
    )

