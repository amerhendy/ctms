#app/schemas/time_logs.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.users import UserSummary

# ─── نماذج الإدخال (Request Schemas) ───

class TimeLogStart(BaseModel):
    task_id: int = Field(..., description="معرف المهمة لبدء تتبع الوقت عليها")
    started_at: datetime = Field(default_factory=datetime.utcnow, description="وقت بدء العمل")
    note: Optional[str] = Field(None, max_length=1000, description="ملاحظة حول طبيعة العمل الحالية")


class TimeLogStop(BaseModel):
    stopped_at: datetime = Field(default_factory=datetime.utcnow, description="و وقت إيقاف التتبع")
    note: Optional[str] = Field(None, max_length=1000, description="تحديث اختياري للملاحظة عند الإغلاق")


# ─── نماذج المخرجات (Response Schemas) ───

class TaskTimeLogOut(BaseModel):
    id: int
    task_id: int
    user_id: int
    started_at: datetime
    stopped_at: Optional[datetime]
    note: Optional[str]
    duration_minutes: Optional[int] = Field(None, description="المدة الإجمالية بالدقائق (محسوبة تلقائياً من القاعدة)")
    
    user: Optional[UserSummary] = None

    class Config:
        from_attributes = True