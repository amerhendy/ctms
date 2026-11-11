#app/schemas/transfers.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.db.enums import TransferStatus
# استيراد النماذج المرتبطة لتغذية أطراف الحركة الإدارية
from app.schemas.departments import DepartmentOut
from app.schemas.users import UserSummary

# ─── نماذج الإدخال والطلبات (Request Schemas) ───

class TransferCreate(BaseModel):
    task_id: int = Field(..., description="معرف المهمة المطلوب نقل مسؤوليتها")
    to_department_id: int = Field(..., description="معرف القسم أو الإدارة المستقبلة للمهمة")
    to_user_id: int = Field(..., description="معرف الموظف المستهدف بالاتصال داخل القسم الجديد")
    transfer_note: Optional[str] = Field(None, max_length=1000, description="مذكرة أو مبررات طلب النقل الإداري")


class TransferAction(BaseModel):
    """النموذج المستخدم للرد على طلب النقل من الجهة المستقبلة (قبول أو رفض)"""
    status: TransferStatus = Field(..., description="حالة الرد الإداري: يجب أن تكون 'accepted' أو 'rejected'")
    rejection_reason: Optional[str] = Field(None, max_length=1000, description="يجب ذكر سبب الرفض في حالة رفض الطلب")


# ─── نماذج المخرجات والاستجابة (Response Schemas) ───

class TaskTransferOut(BaseModel):
    id: int
    task_id: int
    from_department_id: int = Field(..., description="القسم المحيل (صاحب المهمة الحالي)")
    to_department_id: int = Field(..., description="القسم المحال إليه (المستقبل)")
    from_user_id: int = Field(..., description="الموظف الذي قام بطلب النقل")
    to_user_id: int = Field(..., description="الموظف الموجه إليه الطلب في القسم الجديد")
    status: TransferStatus = Field(..., description="الحالة الحالية للطلب (pending, accepted, rejected)")
    rejection_reason: Optional[str] = Field(None, description="سبب الرفض إن وجد")
    transfer_note: Optional[str] = Field(None, description="ملاحظات الطلب المرسل")
    created_at: datetime = Field(..., description="تاريخ ووقت رفع طلب النقل")
    resolved_at: Optional[datetime] = Field(None, description="تاريخ ووقت اتخاذ قرار القبول أو الرفض")
    
    # تفاصيل العلاقات لتسهيل قراءة مسار الحركة في واجهات لوحة التحكم
    from_department: Optional[DepartmentOut] = Field(None, description="تفاصيل القسم المصدر")
    to_department: Optional[DepartmentOut] = Field(None, description="تفاصيل القسم المستقبل")
    from_user: Optional[UserSummary] = Field(None, description="بيانات الموظف مرسل الطلب")
    to_user: Optional[UserSummary] = Field(None, description="بيانات الموظف مستقبل الطلب")

    class Config:
        from_attributes = True