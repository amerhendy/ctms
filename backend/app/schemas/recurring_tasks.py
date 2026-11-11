#app/schemas/recurring_tasks.py
from datetime import datetime, date, time
<<<<<<< HEAD
from typing import Optional, List
from pydantic import BaseModel, field_validator, model_validator, Field
=======
from typing import Optional
from pydantic import BaseModel, field_validator, Field
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
from app.db.enums import TaskPriority,RecurrencePattern


# ─── نماذج الإدخال (Request Schemas)  ───

<<<<<<< HEAD
=======
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


>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
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

<<<<<<< HEAD


# ─── نماذج المخرجات (Response Schemas) ───



# ─── Schemas الخطوات (Recurring Task Steps) ───

class RecurringTaskStepBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    step_order: int = Field(1, ge=1)
    is_parallel: bool = False
    assigned_department_id: Optional[int] = None
    assigned_user_id: Optional[int] = None

    @model_validator(mode="after")
    def validate_assignment_xor(self):
        has_dept = self.assigned_department_id is not None
        has_user = self.assigned_user_id is not None

        if has_dept and has_user:
            raise ValueError("يجب تحديد إما القسم أو المستخدم للقيام بالخطوة، وليس كلاهما معاً.")
        if not has_dept and not has_user:
            raise ValueError("يجب تحديد جهة التكليف للخطوة (إما قسم أو مستخدم).")
        return self


class RecurringTaskStepCreate(RecurringTaskStepBase):
    pass


class RecurringTaskStepUpdate(BaseModel):
    id: Optional[int] = None  # None يعبر عن خطوة جديدة، والـ ID يعبر عن خطوة مسجلة مسبقاً للتحديث
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    step_order: Optional[int] = Field(None, ge=1)
    is_parallel: Optional[bool] = None
    assigned_department_id: Optional[int] = None
    assigned_user_id: Optional[int] = None


class RecurringTaskStepOut(RecurringTaskStepBase):
    id: int
    recurring_task_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Schemas القوالب المتكررة (Recurring Tasks) ───

class RecurringTaskCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    department_id: int = Field(1, ge=1, description="القسم يجب أن يكون صحيح")
    priority: TaskPriority = TaskPriority.MEDIUM
    recurrence_pattern: RecurrencePattern
    interval_value: int = Field(1, ge=1, description="كل كم دورة يتكرر؟")
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    next_run_date: date = Field(..., description="تاريخ أول تشغيل تلقائي قادم")
    run_time: time = Field(default=time(8, 0, 0), description="وقت التشغيل اليومي")
    is_active: bool = True
    steps: Optional[List[RecurringTaskStepCreate]] = []


=======
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
class RecurringTemplateUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    department_id: Optional[int] = None
    priority: Optional[str] = None
    recurrence_pattern: Optional[str] = None
    interval_value: Optional[int] = None
    day_of_week: Optional[int] = None
    day_of_month: Optional[int] = None
<<<<<<< HEAD
    next_run_date: Optional[str] = None
    is_active: Optional[bool] = None
    run_time: Optional[time] = None
    steps: Optional[List[RecurringTaskStepUpdate]] = None  # لدعم التحديث الجزئي Diff Update

=======
    next_run_date: Optional[str] = None  # سنستقبله كنص ونحوله لتاريخ
    is_active: Optional[bool] = None
    run_time: Optional[time] = None  # الحقل المستقبل للوقت

    # 🌟 إضافة المعالج الذكي للوقت لمنع تعليق asyncpg
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    @field_validator("run_time", mode="before")
    @classmethod
    def parse_run_time(cls, value):
        if isinstance(value, str):
            try:
<<<<<<< HEAD
                if len(value) == 5:
                    return datetime.strptime(value, "%H:%M").time()
=======
                # إذا كان النص بصيغة "HH:MM" (مثل "09:00")
                if len(value) == 5:
                    return datetime.strptime(value, "%H:%M").time()
                # إذا كان النص بصيغة "HH:MM:SS" (مثل "09:00:00")
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
                elif len(value) == 8:
                    return datetime.strptime(value, "%H:%M:%S").time()
            except ValueError:
                raise ValueError("تنسيق الوقت غير صحيح، يجب أن يكون HH:MM أو HH:MM:SS")
<<<<<<< HEAD
        return value

=======
        return value 

# ─── نماذج المخرجات (Response Schemas) ───
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172

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
<<<<<<< HEAD
    steps: List[RecurringTaskStepOut] = []
=======
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172

    class Config:
        from_attributes = True


class RecurringTaskLogOut(BaseModel):
    id: int
    template_title: str
    recurring_task_id: int
<<<<<<< HEAD
    status: str
=======
    status: str  # "success" or "failed"
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    generated_task_id: Optional[int]
    error_message: Optional[str]
    run_at: datetime

    class Config:
        from_attributes = True