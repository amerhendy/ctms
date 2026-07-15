#app/schemas/locations.py
from typing import Optional
from pydantic import BaseModel, Field

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


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    is_active: Optional[bool] = Field(None)


# ─── نماذج المخرجات (Response Schemas) ───

class LocationOut(BaseModel):
    id: int
    name: str
    is_active: bool

    class Config:
        from_attributes = True