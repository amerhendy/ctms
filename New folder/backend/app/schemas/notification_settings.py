# app/schemas/notification_settings.py
from pydantic import BaseModel
from typing import Optional

class NotificationSettingsBase(BaseModel):
    browser: bool = False
    email: bool = False
    whatsapp: bool = False
    telegram: bool = False
    sms: bool = False
    google: bool = False

# تُستخدم عند جلب الإعدادات (Read)
class NotificationSettingsOut(NotificationSettingsBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# تُستخدم عند تحديث الإعدادات (Update) - جميع الحقول اختيارية
class NotificationSettingsUpdate(BaseModel):
    browser: Optional[bool] = None
    email: Optional[bool] = None
    whatsapp: Optional[bool] = None
    telegram: Optional[bool] = None
    sms: Optional[bool] = None
    google: Optional[bool] = None