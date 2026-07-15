#app/schemas/task_logs.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

# استيراد ملخص بيانات الموظف لمعرفة من قام بالإجراء
from app.schemas.users import UserSummary

# ─── نماذج المخرجات (Response Schemas) ───

class TaskLogOut(BaseModel):
    id: int
    task_id: int = Field(..., description="معرف المهمة التي تمت عليها الحركة")
    user_id: Optional[int] = Field(None, description="معرف الموظف الذي قام بالإجراء (يكون Null إذا كان الإجراء آلياً من النظام)")
    action_type: str = Field(
        ..., 
        description="نوع الإجراء (مثال: task_created, status_changed, assignee_added, step_completed)"
    )
    old_value: Optional[str] = Field(None, description="القيمة السابقة قبل التعديل (إن وجدت)")
    new_value: Optional[str] = Field(None, description="القيمة الجديدة بعد التعديل (إن وجدت)")
    extra_data: Optional[str] = Field(
        None, 
        description="بيانات إضافية بصيغة نصية أو JSON تفيد في تفاصيل الحركة (مثل اسم الخطوة الفرعية التي حُذفت)"
    )
    timestamp: datetime = Field(..., description="تاريخ ووقت حدوث هذا الإجراء بدقة")
    
    # تضمين كائن الموظف لعرض تفاصيله في واجهة الـ History للفرونت إند
    user: Optional[UserSummary] = Field(None, description="بيانات الموظف المسؤول عن هذا الإجراء")

    class Config:
        from_attributes = True