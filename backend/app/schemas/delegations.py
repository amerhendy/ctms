from __future__ import annotations
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator

# استيراد ملخص بيانات المستخدم لربط أطراف التفويض
from app.schemas.users import UserSummary

# ─── نماذج الطلبات (Request Schemas) ───

class DelegationCreate(BaseModel):
    delegate_id: int = Field(..., description="معرف الموظف البديل (المُفوَّض إليه)")
    permission_types: List[str] = Field(
        ..., 
        min_items=1, 
        description="قائمة الصلاحيات الممنوحة (مثل: تفويض توقيع، تفويض اعتماد مهام، إلخ)"
    )
    start_date: datetime = Field(..., description="تاريخ بدء سريان التفويض")
    end_date: Optional[datetime] = Field(None, description="تاريخ انتهاء التفويض (اختياري، إذا كان مفتوحاً)")
    notes: Optional[str] = Field(None, max_length=1000, description="ملاحظات أو أسباب التفويض")

    @field_validator("end_date")
    @classmethod
    def validate_dates(cls, v: Optional[datetime], info):
        """التحقق من أن تاريخ الانتهاء لا يمكن أن يكون قبل تاريخ البدء"""
        start_date = info.data.get("start_date")
        if v and start_date and v < start_date:
            raise ValueError("تاريخ انتهاء التفويض لا يمكن أن يكون قبل تاريخ البدء")
        return v


class DelegationUpdate(BaseModel):
    """نموذج لتعديل أو تمديد أو إلغاء التفويض قبل وقته"""
    end_date: Optional[datetime] = Field(None, description="تعديل تاريخ الانتهاء")
    is_active: Optional[bool] = Field(None, description="إيقاف التفويض يدوياً بشكل مبكر")
    notes: Optional[str] = Field(None, max_length=1000)


# ─── نماذج الاستجابة (Response Schemas) ───

class DelegationOut(BaseModel):
    id: int
    delegator_id: int = Field(..., description="معرف الموظف الأصيل (المُفوِّض)")
    delegate_id: int = Field(..., description="معرف الموظف البديل (المُفوَّض إليه)")
    
    # جعلناها List[str] لسهولة التعامل معها في الواجهات، وسنقوم بالتحويل في الـ الـ endpoint أو الـ validator
    permission_types: List[str] = Field(..., description="الصلاحيات الممنوحة")
    
    start_date: datetime
    end_date: Optional[datetime]
    is_active: bool
    notes: Optional[str]
    created_at: datetime
    
    # تفاصيل الحسابات المرتبطة بالتفويض
    delegator: Optional[UserSummary] = Field(None, description="بيانات المدير أو الموظف صاحب الصلاحية الأصلي")
    delegate: Optional[UserSummary] = Field(None, description="بيانات الموظف البديل")

    class Config:
        from_attributes = True

    @field_validator("permission_types", mode="before")
    @classmethod
    def convert_str_to_list(cls, v):
        """تحويل النصوص المخزنة في القاعدة كـ Comma separated string إلى قائمة بايثون تلقائياً"""
        if isinstance(v, str):
            return [p.strip() for p in v.split(",") if p.strip()]
        return v