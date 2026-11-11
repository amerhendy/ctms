# schemas/violation.py
from pydantic import BaseModel, Field
from typing import Optional

class ViolationSchema(BaseModel):
    violation_type: str = Field(..., description="نوع المخالفة مثل: tab_switch, blur, key_press")
    details: Optional[str] = Field(None, description="تفاصيل إضافية عن المخالفة")

    class Config:
        json_schema_extra = {
            "example": {
                "violation_type": "tab_switch",
                "details": "تم التبديل إلى نافذة أخرى"
            }
        }