from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, model_validator

class TemplateStepCreate(BaseModel):
    title                  : str
    description            : Optional[str] = None
    step_order             : int
    is_parallel            : bool = False
    assigned_department_id : Optional[int] = None
    assigned_user_id       : Optional[int] = None

    @model_validator(mode="after")
    def must_have_assignee(self):
        if not self.assigned_department_id and not self.assigned_user_id:
            raise ValueError("كل خطوة لازم يكون ليها إدارة أو موظف مسؤول")
        return self


class TemplateStepOut(BaseModel):
    id                     : int
    title                  : str
    description            : Optional[str]
    step_order             : int
    is_parallel            : bool
    assigned_department_id : Optional[int]
    assigned_user_id       : Optional[int]

    model_config = {"from_attributes": True}

