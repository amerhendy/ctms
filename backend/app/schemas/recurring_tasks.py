#app/schemas/recurring_tasks.py
from datetime import datetime, date, time
from typing import Optional
from pydantic import BaseModel, field_validator, Field
from app.db.enums import TaskPriority,RecurrencePattern


# ─── نماذج الإدخال (Request Schemas)  ───

class RecurringTaskCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    department_id: int
    priority: TaskPriority = TaskPriority.MEDIUM
    recurrence_pattern: RecurrencePattern
    interval_value: int = Field(1, ge=1, description="كل كم دورة يتكرر؟ (مثال: كل 2 أسابيع)")
    day_of_week: Optional[int] = Field(None, ge=0, le=6, description="0 للسبت أو الإثنين حسب إعداد السيرفر")
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    next_run_date: date = Field(..., description="تاريخ أول تشغيل تلقائي قادم")
    run_time: time = Field(default=time(8, 0, 0), description="وقت التشغيل اليومي (مثال: 08:00:00)")
    is_active: bool = True


class RecurringTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    recurrence_pattern: Optional[RecurrencePattern] = None
    interval_value: Optional[int] = None
    day_of_week: Optional[int] = None
    day_of_month: Optional[int] = None
    next_run_date: Optional[date] = None
    run_time: Optional[time] = None
    is_active: Optional[bool] = None

class RecurringTemplateUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    department_id: Optional[int] = None
    priority: Optional[str] = None
    recurrence_pattern: Optional[str] = None
    interval_value: Optional[int] = None
    day_of_week: Optional[int] = None
    day_of_month: Optional[int] = None
    next_run_date: Optional[str] = None  # سنستقبله كنص ونحوله لتاريخ
    is_active: Optional[bool] = None
    run_time: Optional[time] = None  # الحقل المستقبل للوقت

    # 🌟 إضافة المعالج الذكي للوقت لمنع تعليق asyncpg
    @field_validator("run_time", mode="before")
    @classmethod
    def parse_run_time(cls, value):
        if isinstance(value, str):
            try:
                # إذا كان النص بصيغة "HH:MM" (مثل "09:00")
                if len(value) == 5:
                    return datetime.strptime(value, "%H:%M").time()
                # إذا كان النص بصيغة "HH:MM:SS" (مثل "09:00:00")
                elif len(value) == 8:
                    return datetime.strptime(value, "%H:%M:%S").time()
            except ValueError:
                raise ValueError("تنسيق الوقت غير صحيح، يجب أن يكون HH:MM أو HH:MM:SS")
        return value 

# ─── نماذج المخرجات (Response Schemas) ───

class RecurringTaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    department_id: int
    created_by: int
    priority: TaskPriority
    recurrence_pattern: RecurrencePattern
    interval_value: int
    day_of_week: Optional[int]
    day_of_month: Optional[int]
    next_run_date: date
    run_time: time
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RecurringTaskLogOut(BaseModel):
    id: int
    template_title: str
    recurring_task_id: int
    status: str  # "success" or "failed"
    generated_task_id: Optional[int]
    error_message: Optional[str]
    run_at: datetime

    class Config:
        from_attributes = True