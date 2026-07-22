# app/schemas/locations.py
from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

# ─── نماذج الإدخال والتحديث (Request Schemas) ───

class LocationCreate(BaseModel):
    name: str = Field(
        ..., 
        min_length=2, 
        max_length=255, 
        description="اسم فرع الشركة أو موقع العمل الجغرافي (مثال: المقر الرئيسي، فرع الإسكندرية)"
    )
    is_active: bool = Field(
        True, 
        description="حالة الموقع (نشط/معطل) للتحكم في ظهوره أثناء إنشاء الحسابات أو الأقسام الجديدة"
    )
    parent_id: Optional[int] = Field(
        None, 
        description="معرف الموقع الأب (في حال كان الموقع فرعياً يتبع موقعاً رئيسياً)"
    )


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    is_active: Optional[bool] = Field(None)
    parent_id: Optional[int] = Field(None, description="معرف الموقع الأب الجديد")


# ─── نماذج المخرجات (Response Schemas) ───

class LocationOut(BaseModel):
    id: int
    name: str
    is_active: bool
    parent_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# ─── نموذج الهيكل الشجري للمواقع (Tree Response Schema) ───

class LocationTreeOut(BaseModel):
    id: int
    name: str
    is_active: bool
    parent_id: Optional[int] = None
    children: List[LocationTreeOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

# إعادة بناء النموذج لدعم المراجع الذاتية المتداخلة (Recursive / Forward Reference) في Pydantic v2
LocationTreeOut.model_rebuild()