#app/schemas/department_manager_sch.py
from pydantic import BaseModel, Field,ConfigDict
from typing import List,Optional
from datetime import datetime
class AssignManagerSchema(BaseModel):
    department_id: int = Field(..., gt=0, description="ID الخاص بالإدارة")
    user_id: int = Field(..., gt=0, description="ID الخاص بالموظف")
    is_primary: bool = True

    class Config:
        json_schema_extra = {
            "example": {
                "department_id": 1,
                "user_id": 105,
                "is_primary": True
            }
        }
class UserSchema(BaseModel):
    id: int
    full_name: str
    job_title: str # أضفتها لأنها موجودة في الخطأ
    avatar_url: Optional[str] = None
    employee_number: str

    model_config = ConfigDict(from_attributes=True)

class ManagerOut(BaseModel):
    department_id: int
    user_id: int
    is_primary: bool
    user: UserSchema # يجب أن يكون اسم الحقل مطابقاً لاسم العلاقة في الموديل

    model_config = ConfigDict(from_attributes=True)

# 2. سكيما لعرض قائمة المديرين (تستخدم عند جلب المديرين لقسم)
class DepartmentManagersListOut(BaseModel):
    department_id: int
    managers: List[ManagerOut]

    class Config:
        from_attributes = True

