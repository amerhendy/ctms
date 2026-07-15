#app/schemas/task_steps.py
from pydantic import BaseModel, Field,field_validator,model_validator
from typing import Optional,List,Any
from datetime import datetime
from app.db.enums import StepStatus

# استيراد ملخص بيانات الموظف لتوثيق من قام بإنجاز الخطوة
from app.schemas.users import UserSummary
from app.schemas.departments import DepartmentOut
# ─── نماذج الإدخال والطلبات (Request Schemas) ───
def filter_null_ids(v: Any) -> Any:
    if isinstance(v, list):
        return [item for item in v if item is not None]
    return v

class TaskStepCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    step_order: int = Field(None, ge=0)
    is_parallel: bool = False
    assigned_department_id: Optional[int] = None
    assigned_user_id: Optional[int] = None
    status: StepStatus = StepStatus.PENDING
    parent_id: Optional[int] = None
    dependency_ids        : Optional[List[int]] = [] 
    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        allowed = ["pending", "in_progress", "completed", "skipped"]
        if v.lower() not in allowed:
            raise ValueError(f"الحالة يجب أن تكون واحدة من: {allowed}")
        return v.lower()
    
    @model_validator(mode='after')
    def validate_step_logic(self):
        dept = self.assigned_department_id
        user = self.assigned_user_id
        
        # 1. تحقق التكليف والمسؤولية
        if dept is None and user is None:
            raise ValueError("يجب تحديد إما قسم أو مستخدم مسؤول عن هذه الخطوة")
        
        # 2. الحارس المعماري (المنع البرمجي المسبق):
        # إذا كانت الخطوة فرعية (تمتلك parent_id)، يمنع تماماً أن تمتلك روابط تبعية زمنية مستقلة
        if self.parent_id is not None and self.dependency_ids:
            raise ValueError("الخطوات الفرعية (Checklists) لا يمكنها امتلاك روابط تبعية زمنية مستقلة؛ تتبع أبنائها فقط.")
            
        return self
    
    @model_validator(mode='after')
    def validate_assignee(self):
        # التحقق هنا يتم بعد أن تم بناء النموذج بالكامل
        dept = self.assigned_department_id
        user = self.assigned_user_id
        
        if dept is None and user is None:
            raise ValueError("يجب تحديد إما قسم أو مستخدم مسؤول عن هذه الخطوة")
        
        return self

# 2. المخطط المستخدم عند التحديث
class TaskStepUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[StepStatus] = None
    is_parallel: Optional[bool] = None
    assigned_department_id: Optional[int] = None
    assigned_user_id: Optional[int] = None
    step_order: Optional[int] = None
    parent_id: Optional[int] = None
    dependency_ids: Optional[List[int]] = None

# 3. المخطط المستخدم للاستجابة عند تغيير الحالة (Toggle)
class TaskStepToggleResponse(BaseModel):
    id: int
    status: StepStatus
    completed_at: Optional[datetime] = None
    completed_by: Optional[int] = None

class TaskStepOut(BaseModel):
    id: int
    task_id: int
    title: str
    description: Optional[str] = None
    step_order: int
    is_parallel: bool
    status: StepStatus
    assigned_department_id: Optional[int] = None
    assigned_user_id: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    parent_id: Optional[int] = None
    dependency_ids: List[int] = []
    
    # 👇 التعديل الجذري لمنع خطأ MissingGreenlet وكسر الـ Lazy Loading تلقائياً
    children: List['TaskStepOut'] = Field(default=[], init=False, repr=False)
    
    completed_by_user: Optional[UserSummary] = Field(None, description="بيانات الموظف الذي أنجز الخطوة")
    assignee: Optional[UserSummary] = Field(None, description="بيانات الموظف المسند له الخطوة")
    department: Optional[DepartmentOut] = Field(None, description="بيانات القسم المسند له الخطوة")
    
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StepReorderItem(BaseModel):
    id: int = Field(..., description="معرف الخطوة")
    step_order: int = Field(..., ge=0, description="الترتيب الجديد للخطوة")