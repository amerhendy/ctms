# app/schemas/TaskWorkflowStep_schema.py
from __future__ import annotations
from typing import Optional, List
from datetime import datetime
from app.db.enums import StepStatus
from .users import UserSummary
from .departments import DepartmentOut
from pydantic import BaseModel, model_validator
class WorkflowStepCreate(BaseModel):
    title                  : str
    description            : Optional[str] = None
    step_order             : int
    is_parallel            : bool = False
    assigned_department_id : Optional[int] = None
    assigned_user_id       : Optional[int] = None
    # إضافة الاعتماديات عند الإنشاء
    parent_step_ids        : Optional[List[int]] = [] 

    @model_validator(mode="after")
    def must_have_assignee(self):
        if not self.assigned_department_id and not self.assigned_user_id:
            raise ValueError("كل خطوة لازم يكون ليها إدارة أو موظف مسؤول")
        return self


class WorkflowStepUpdate(BaseModel):
    title                  : Optional[str] = None
    description            : Optional[str] = None
    step_order             : Optional[int] = None
    is_parallel            : Optional[bool] = None
    assigned_department_id : Optional[int] = None
    assigned_user_id       : Optional[int] = None


class WorkflowStepComplete(BaseModel):
    notes: Optional[str] = None    # ملاحظة اختيارية عند الإنهاء
    
class WorkflowStepOut(BaseModel):
    id                     : int
    title                  : str
    version: Optional[int] = 1
    description            : Optional[str]
    step_order             : int
    is_parallel            : bool
    status                 : StepStatus
    created_at             : datetime
    updated_at             : datetime
    assigned_department_id : Optional[int]
    assigned_user_id       : Optional[int]
    parent_step_ids        : List[int] = [] # قائمة الـ Parents لهذه الخطوة
    assigned_user          : Optional[UserSummary] = None
    assigned_department    : Optional[DepartmentOut] = None

    class Config:
        from_attributes = True