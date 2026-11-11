from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class AdminLogin(BaseModel):
    username: str
    password: str


class AdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    username: str
    full_name: Optional[str] = None



class TokenResponse(BaseModel):
    access_token: str = Field(..., description="توكن الوصول القصير الصلاحية والمستخدم في ترويسة الطلبات")
    refresh_token: str = Field(..., description="توكن التحديث طويل الصلاحية")
    token_type: str = Field("bearer", description="نوع التوكن المستخدم في الـ Authorization Header")
    user_id: str = Field(..., description="المعرف الرقمي الفريد للموظف")
    full_name: str = Field(..., description="الاسم الكامل للموظف")

    class Config:
        from_attributes = True