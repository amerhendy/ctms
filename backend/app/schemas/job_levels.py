#app/schemas/job_levels.py
from typing import Optional
from pydantic import BaseModel, Field

# ─── نماذج الإدخال والتحديث (Request Schemas) ───

class JobLevelCreate(BaseModel):
    level_number: int = Field(
        ..., 
        ge=1, 
        le=20, 
        description="رقم المستوى الوظيفي الإداري (يجب أن يكون بين 1 و 20)"
    )
    title: str = Field(
        ..., 
        min_length=2, 
        max_length=255, 
        description="المسمى الرسمي للمستوى الوظيفي (مثال: مدير عام، رئيس قسم)"
    )
    description: Optional[str] = Field(
        None, 
        max_length=1000, 
        description="وصف اختياري للمسؤوليات أو الصلاحيات العامة لهذا المستوى"
    )


class JobLevelUpdate(BaseModel):
    level_number: Optional[int] = Field(
        None, 
        ge=1, 
        le=20, 
        description="رقم المستوى الوظيفي الإداري (يجب أن يكون بين 1 و 20)"
    )
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


# ─── نماذج المخرجات (Response Schemas) ───

class JobLevelOut(BaseModel):
    id: int
    level_number: int
    title: str
    description: Optional[str]

    class Config:
        from_attributes = True