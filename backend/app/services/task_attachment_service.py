# app/services/task_comment_service.py
import os
import shutil
from fastapi import HTTPException
from fastapi.responses import FileResponse
from datetime import datetime
from fastapi import UploadFile
from app.core.utils import logger
from app.schemas.base import get_task_or_404,apply_pagination
from app.core.permissions import require_view_permission, get_task_permissions

from app.models.User import User
from app.models.TaskAttachment import TaskAttachment
from app.schemas.task_comment_sch import CommentOut
from app.repositories.attachment_repository import AttachmentRepository
from app.services.log_service import LogService
from app.services.task_service import TaskService
from app.services.notification_service import NotificationService,ws_manager
from app.core.utils import _get,_to_iso
from app.core.config import settings
class AttachmentService:
    @staticmethod
    async def list_attachments(db, task_id: int,page:int,limit:int,current_user:User):
        task = await get_task_or_404(db, task_id)
        perms = await require_view_permission(db, current_user, task)
        if not perms.can_view_attachment:
            raise HTTPException(403, "غير مصرح لك برؤية المرفقات")
        query=AttachmentRepository.base_query()
        base_query=query.where(TaskAttachment.task_id == task_id)
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
                "id": _get(att, "id"),
                "file_name": _get(att, "file_name"),
                "file_path": _get(att, "file_path"),
                "file_size": _get(att, "file_size"),
                "mime_type": _get(att, "mime_type"),
                "created_at": _to_iso(_get(att, "created_at"))
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

    @staticmethod
    async def add_attachment(db, task_id: int, file: UploadFile, current_user):
        """
            رفع ملف مرفق جديد.
        - الصلاحية: أي مستخدم له علاقة بالمهمة (can_add_attachment)
        """
        UPLOAD_DIR = settings.TASK_ATTACHMENT_DIR
        MAX_FILE_SIZE = settings.MAX_FILE_SIZE
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        ALLOWED_EXTENSIONS = settings.ALLOWED_EXTENSIONS
        NOWTIME=datetime.now().replace(tzinfo=None)

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
    
    @staticmethod
    async def delete_attachment(db,task_id: int,attach_id: int,current_user):
        """
        حذف ملف مرفق.
        - الصلاحية: مدير البرنامج أو منشئ الملف (can_delete_attachment)
        """
        task = await get_task_or_404(db, task_id)
        attachment=await AttachmentRepository.get_attachment_by_task_attachment(db,task_id,attach_id)
        
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
    
    @staticmethod
    async def download_attachment(db,task_id,attach_id,current_user):
        
        """تحميل ملف مرفق مع التحقق من صلاحية العرض."""
        # التحقق من وجود المهمة وصلاحية المستخدم
        task = await get_task_or_404(db, task_id)
        await require_view_permission(db, current_user, task)

        # جلب المرفق
        attachment=await AttachmentRepository.get_attachment_by_task_attachment(db,task_id,attach_id)
                
        if not attachment:
            raise HTTPException(404, "المرفق غير موجود")

        # التحقق من وجود الملف على الخادم
        if not os.path.exists(attachment.file_path):
            raise HTTPException(404, "الملف غير موجود على الخادم")

        # إعادة الملف مع اسمه الأصلي
        return FileResponse(
            path=attachment.file_path,
            filename=attachment.file_name,
            media_type=attachment.mime_type or "application/octet-stream"
        )

