#app/schemas/tasks.py
from datetime import datetime, date
from typing import Optional, List
from pydantic import field_validator, BaseModel, Field, ConfigDict
from app.db.enums import TaskStatus, TaskPriority, UrgencyStatus
from app.models import  TaskStep
# استيراد النماذج المرتبطة من ملفاتها الخاصة لربط علاقات المهمة الكاملة
from app.schemas.users import UserSummary
from app.schemas.departments import DepartmentOut
from app.schemas.task_steps import TaskStepCreate, TaskStepOut
from app.schemas.task_assignments import TaskAssignmentOut


# ─── 1. نماذج البحث والتصفية المتقدمة (Search & Filter) ───

class SearchParams(BaseModel):
    q: Optional[str] = Field(None, description="البحث بالنص الحر في عنوان المهمة أو وصفها")
    file_number: Optional[str] = Field(None, description="تصفية برقم الملف الصادر أو الوارد الخاص بالمعاملة")
    status: Optional[TaskStatus] = Field(None, description="تصفية بحالة المهمة الحاليّة")
    priority: Optional[TaskPriority] = Field(None, description="تصفية بدرجة الأهمية والأولوية")
    is_urgent: Optional[bool] = Field(None, description="عرض المهام المستعجلة فقط أو العادية فقط")
    department_id: Optional[int] = Field(None, description="تصفية بالقسم المالك أو المسؤول عن المهمة")
    date_from: Optional[datetime] = Field(None, description="تاريخ بدء النطاق الزمني لتاريخ الاستحقاق")
    date_to: Optional[datetime] = Field(None, description="تاريخ نهاية النطاق الزمني لتاريخ الاستحقاق")
    created_by: Optional[int] = Field(None, description="تصفية بالموظف الذي قام بإنشاء المهمة")
    
    # حقول التصفح والصفحات المدمجة (Pagination)
    page: int = Field(1, ge=1, description="رقم الصفحة الحالية")
    page_size: int = Field(20, ge=1, le=100, description="عدد السجلات المسموح بها في الصفحة الواحدة")



# ─── 4. نماذج إدخال وتحديث المهام (Request Schemas) ───

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255, description="العنوان الرئيسي للمهمة أو المعاملة")
    description: Optional[str] = Field(None, description="تفاصيل وشرح المبررات والخطوات المطلوبة")
    file_number: Optional[str] = Field(None, max_length=100, description="رقم الملف الإداري للمتابعة")
    status: TaskStatus = Field(TaskStatus.NOT_STARTED, description="الحالة الأولية للمهمة")
    priority: TaskPriority = Field(TaskPriority.MEDIUM, description="أولوية المهمة")
    start_date: Optional[datetime] = Field(None, description="تاريخ بدء تنفيذ المهمة")
    due_date: Optional[datetime] = Field(None, description="تاريخ استحقاق تسليم المهمة")
    reminder_datetime: Optional[datetime] = Field(None, description="تاريخ ووقت تذكير المكلفين قبل موعد الاستحقاق")
    is_urgent: bool = Field(False, description="هل المهمة مستعجلة وتحتاج إلى اهتمام فوري؟")
    is_important: bool = Field(True, description="هل المهمة مهمة وتتطلب اهتمامًا خاصًا؟")
    department_id: int = Field(..., description="المعرف الرقمي للقسم المالك للمهّمة")
    
    # إمكانية تمرير خطوات فرعية وموظفين مكلفين مباشرة أثناء إنشاء المهمة
    steps: Optional[List[TaskStepCreate]] = Field(default=[], description="قائمة اختياريّة بالخطوات التنفيذية الأولى")
    assigned_ids: Optional[List[int]] = Field(default=[], description="قائمة بمعرفات الموظفين المكلفين فوراً")


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    file_number: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    reminder_datetime: Optional[datetime] = None
    department_id: Optional[int] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100, description="نسبة الإنجاز الفعلي للمهمة")
    is_urgent: Optional[bool] = None
    is_important: Optional[bool] = None
    is_favorite: Optional[bool] = None
    completed_at: Optional[datetime] = None

 
# ─── 5. نماذج المخرجات والاستجابة (Response Schemas) ───

class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    file_number: Optional[str]
    start_date: Optional[datetime]
    due_date: Optional[datetime]
    reminder_datetime: Optional[datetime]
    is_urgent: bool
    is_important: bool
    priority: TaskPriority
    progress_percentage: int
    status: TaskStatus
    created_by: int
    department_id: int
    urgency_requested_at: Optional[datetime]
    urgency_requested_by: Optional[int]
    urgency_request_status: Optional[UrgencyStatus]
    created_at: datetime
    updated_at: datetime
    eisenhower_quadrant: str
    steps: List[TaskStepOut] = []
    assignments: List[TaskAssignmentOut] = []
    creator: Optional[UserSummary] = Field(None, alias="created_by_user")
    department: Optional[DepartmentOut] = None
    is_favorite: bool = False
    completed_at: Optional[datetime] = None
    permissions: Optional[dict] = None

    @field_validator('completed_at', mode='before')
    @classmethod
    def cast_datetime_to_date(cls, v):
        if isinstance(v, datetime):
            return v.date()
        return v
    class Config:
        from_attributes = True
        populate_by_name = True


class TaskListItem(BaseModel):
    """نموذج خفيف ومثالي لعرض المهام داخل القوائم والجداول لتخفيف استهلاك البيانات"""
    id: int
    title: str
    priority: TaskPriority
    status: TaskStatus
    is_urgent: bool
    is_important: bool
    due_date: Optional[datetime]
    progress_percentage: int
    department_id: int
    department_name: Optional[str] = Field(None, description="اسم القسم المسؤول فقط")
    created_by: int
    creator_name: Optional[str] = Field(None, description="اسم منشئ المهمة")
    urgency_request_status: Optional[UrgencyStatus]
    is_favorite: bool = False
    file_number: Optional[str] = Field(None, description="رقم الملف المرتبط بالمهمة")
    steps_count: int = Field(0, description="إجمالي عدد الخطوات")
    completed_steps_count: int = Field(0, description="عدد الخطوات المنجزة")
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EisenhowerDistributionItem(BaseModel):
    quadrant: str
    count: int