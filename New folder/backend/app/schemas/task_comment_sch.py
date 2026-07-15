#app/schemas/task_comment_sch.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.users import UserSummary

# ─── نماذج الإدخال (Request Schemas) ───

class CommentCreate(BaseModel):
    task_id: int = Field(..., description="معرف المهمة المراد التعليق عليها")
    comment_text: str = Field(..., min_length=1, description="نص التعليق")


class CommentUpdate(BaseModel):
    comment_text: str = Field(..., min_length=1, description="تعديل نص التعليق")


# ─── نماذج المخرجات (Response Schemas) ───

class CommentOut(BaseModel):
    id: int
    task_id: int
    user_id: int
    comment_text: str
    created_at: datetime
    updated_at: datetime
    
    # إظهار بيانات الموظف صاحب التعليق مباشرة في الواجهة
    user: Optional[UserSummary] = None

    class Config:
        from_attributes = True