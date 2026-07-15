#app/schemas/notifications.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from typing import List, Generic, TypeVar


class NotificationMarkRead(BaseModel):
    """يستخدمه الفرونت-إند لتحديث حالة الإشعار إلى مقروء"""
    is_read: bool = Field(True, description="تأكيد قراءة الإشعار")


# ─── نماذج المخرجات (Response Schemas) ───

class NotificationOut(BaseModel):
    id: int
    user_id: int = Field(..., description="معرف الموظف المستهدف بالإشعار")
    type: str = Field(..., description="نوع الإشعار (مثال: task_assigned, transfer_requested, system_alert)")
    title: str = Field(..., description="عنوان التنبيه")
    body: str = Field(..., description="نص ومحتوى الإشعار التفصيلي")
    related_task_id: Optional[int] = Field(None, description="معرف المهمة المرتبطة بالإشعار إن وجدت للتوجيه السريع لها")
    read_at: Optional[datetime] = Field(None, description="تاريخ ووقت القراءة (يكون null إذا لم يقرأ بعد)")
    created_at: datetime = Field(..., description="تاريخ ووقت إرسال الإشعار")

    class Config:
        from_attributes = True


class NotificationStatsOut(BaseModel):
    """نموذج سريع لإظهار العدادات في أعلى واجهة المستخدم (Header Badge)"""
    unread_count: int = Field(..., description="عدد الإشعارات غير المقروءة حالياً للموظف")
    total_count: int = Field(..., description="إجمالي عدد الإشعارات")