#app/schemas/urgency.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

# استيراد ملخص الموظف لتوثيق أطراف طلب التعجيل
from app.schemas.users import UserSummary

# ─── نماذج الإدخال والطلبات (Request Schemas) ───

class UrgencyRequest(BaseModel):
    reason: Optional[str] = Field(
        None, 
        max_length=1000, 
        description="مبررات وأسباب طلب استعجال أو تعجيل هذه المهمة"
    )


class UrgencyAction(BaseModel):
    """النموذج المستخدم للرد على طلب الاستعجال (إما بالاعتماد والموافقة أو الرفض)"""
    action: str = Field(
        ..., 
        description="الإجراء المتخذ: يجب أن يكون إما 'approve' للموافقة أو 'reject' للرفض"
    )
    reason: Optional[str] = Field(
        None, 
        max_length=1000, 
        description="السبب الإداري للموافقة أو الرفض (إلزامي في حال الرفض عادةً)"
    )


# ─── نماذج المخرجات والاستجابة (Response Schemas) ───

class TaskUrgencyOut(BaseModel):
    id: int
    task_id: int = Field(..., description="معرف المهمة المستعجلة")
    requested_by_id: int = Field(..., description="معرف المسؤول الذي رفع طلب الاستعجال")
    reason: Optional[str] = Field(None, description="أسباب طلب التعجيل")
    status: str = Field(..., description="الحالة الحالية للطلب (pending, approved, rejected)")
    action_by_id: Optional[int] = Field(None, description="معرف الشخص الذي بتّ في الطلب")
    action_reason: Optional[str] = Field(None, description="مبررات قبول أو رفض الطلب")
    created_at: datetime = Field(..., description="تاريخ ووقت رفع طلب الاستعجال")
    resolved_at: Optional[datetime] = Field(None, description="تاريخ ووقت اتخاذ القرار")
    
    # تفاصيل العلاقات لتوثيق الحركة في لوحات التحكم والتقارير
    requested_by: Optional[UserSummary] = Field(None, description="بيانات المسؤول مقدم الطلب")
    action_by: Optional[UserSummary] = Field(None, description="بيانات الموظف أو المدير الذي قام بالرد")

    class Config:
        from_attributes = True