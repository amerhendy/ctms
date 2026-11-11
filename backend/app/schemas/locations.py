<<<<<<< HEAD
# app/schemas/locations.py
from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
=======
#app/schemas/locations.py
from typing import Optional
from pydantic import BaseModel, Field
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172

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
<<<<<<< HEAD
    parent_id: Optional[int] = Field(
        None, 
        description="معرف الموقع الأب (في حال كان الموقع فرعياً يتبع موقعاً رئيسياً)"
    )
=======
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    is_active: Optional[bool] = Field(None)
<<<<<<< HEAD
    parent_id: Optional[int] = Field(None, description="معرف الموقع الأب الجديد")
=======
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172


# ─── نماذج المخرجات (Response Schemas) ───

class LocationOut(BaseModel):
    id: int
    name: str
    is_active: bool
<<<<<<< HEAD
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
=======

    class Config:
        from_attributes = True
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
