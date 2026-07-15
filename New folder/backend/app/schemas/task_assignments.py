#app/schemas/task_assignments.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

# استيراد الأنواع المخصصة وملخص الموظف من ملفاتهما
from app.db.enums import AssignmentType
from app.schemas.users import UserSummary

# ─── نماذج الإدخال والطلبات (Request Schemas) ───

class TaskAssignmentCreate(BaseModel):
    task_id: int = Field(..., description="معرف المهمة المراد التكليف عليها")
    user_id: int = Field(..., description="معرف الموظف المكلف بالمهمة")
    assignment_type: AssignmentType = Field(..., description="نوع التكليف الإداري (رئيسي، فرعي، إلخ)")


class TaskAssignmentUpdate(BaseModel):
    """يستخدم لتعديل نوع التكليف الإداري لموظف معين على المهمة"""
    assignment_type: AssignmentType = Field(..., description="تحديث نوع أو دور الموظف في المهمة")


# ─── نماذج المخرجات والاستجابة (Response Schemas) ───

class TaskAssignmentOut(BaseModel):
    id: int
    task_id: Optional[int] = None
    user_id: int = Field(..., description="معرف الموظف المكلف")
    assignment_type: AssignmentType = Field(..., description="نوع وطبيعة التكليف")
    assigned_by: int = Field(..., description="معرف الموظف أو المسؤول الذي أصدر التكليف")
    assigned_at: datetime = Field(..., description="تاريخ ووقت صدور التكليف")
    deleted_at: Optional[datetime] = Field(None, description="تاريخ الحذف الناعم إن وجد")
    
    # ربط كائنات الموظفين لعرض تفاصيلهم كاملة في شاشات المهام للفرونت إند
    user: Optional[UserSummary] = Field(None, description="بيانات الموظف المكلف بالتنفيذ")
    assigned_by_user: Optional[UserSummary] = Field(None, description="بيانات المسؤول الذي قام بالتكليف")

    class Config:
        from_attributes = True