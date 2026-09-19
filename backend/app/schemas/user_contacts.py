from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

# ─── نماذج الإدخال والتحديث (Request Schemas) ───

class UserContactBase(BaseModel):
    phone_number: Optional[str] = Field(None, max_length=20, description="رقم الهاتف")
    whatsapp_number: Optional[str] = Field(None, max_length=20, description="رقم الواتساب")
    telegram_username: Optional[str] = Field(None, max_length=50, description="اسم مستخدم تليجرام")
    extension_number: Optional[str] = Field(None, max_length=10, description="الرقم الداخلي")
    is_private: bool = Field(False, description="هل جهة الاتصال خاصة؟")


class UserContactCreate(UserContactBase):
    """سكيما لإنشاء جهة اتصال جديدة (يتم تمرير الـ user_id برمجياً في الـ Service أو الـ API)"""
    pass


class UserContactUpdate(BaseModel):
    """سكيما لتحديث جهة الاتصال - جميع الحقول اختيارية عند التعديل"""
    phone_number: Optional[str] = Field(None, max_length=20)
    whatsapp_number: Optional[str] = Field(None, max_length=20)
    telegram_username: Optional[str] = Field(None, max_length=50)
    extension_number: Optional[str] = Field(None, max_length=10)
    is_private: Optional[bool] = None


# ─── نماذج المخرجات (Response Schemas) ───

class UserContactOut(UserContactBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # للتوافق مع كائنات SQLAlchemy