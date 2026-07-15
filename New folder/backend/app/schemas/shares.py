#app/schemas/shares.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.db.enums import SharePermission
# استيراد ملخص الموظف لمعرفة مع من تمت مشاركة المهمة
from app.schemas.users import UserSummary

# ─── نماذج الإدخال والطلبات (Request Schemas) ───

class ShareCreate(BaseModel):
    task_id: int = Field(..., description="معرف المهمة المراد مشاركتها")
    shared_with_user_id: int = Field(..., description="معرف الموظف المستهدف بالمشاركة (الطرف المستقبل)")
    permission: SharePermission = Field(
        SharePermission.VIEW, 
        description="نوع الصلاحية الممنوحة للمشاركة: إما 'VIEW' للقراءة فقط أو 'EDIT' للتعديل"
    )
    expires_at: Optional[datetime] = Field(
        None, 
        description="تاريخ ووقت انتهاء صلاحية هذه المشاركة تلقائياً (اختياري)"
    )


class ShareUpdate(BaseModel):
    """نموذج لتحديث صلاحيات المشاركة الحالية أو تمديد وقتها"""
    permission: Optional[SharePermission] = Field(None, description="تعديل نوع الصلاحية الممنوحة")
    expires_at: Optional[datetime] = Field(None, description="تحديث أو إلغاء تاريخ انتهاء المشاركة")


# ─── نماذج المخرجات والاستجابة (Response Schemas) ───

class TaskShareOut(BaseModel):
    id: int
    task_id: int
    shared_with_user_id: int = Field(..., description="معرف الموظف الذي تمت مشاركة المهمة معه")
    permission: SharePermission = Field(..., description="الصلاحية الممنوحة للمشاركة الحالية")
    shared_by: int = Field(..., description="معرف الموظف الذي قام بإنشاء ومشاركة هذه المهمة")
    expires_at: Optional[datetime] = Field(None, description="تاريخ انتهاء صلاحية الرابط أو المشاركة إن وجد")
    created_at: datetime = Field(..., description="تاريخ ووقت حدوث عملية المشاركة")
    
    # تفاصيل العلاقات لتغذية شاشات التعاون في واجهة المستخدم
    shared_with: Optional[UserSummary] = Field(None, description="البيانات المختصرة للموظف المستقبل للمشاركة")

    class Config:
        from_attributes = True