from pydantic import BaseModel, Field
from app.db.enums import GlobalRole
from typing import Optional,List
# ─── نماذج الطلبات (Request Schemas) ───

class LoginRequest(BaseModel):
    identifier: str = Field(
        ..., 
        min_length=1, 
        max_length=255, 
        description="رقم الموظف أو البريد الإلكتروني الخاص بالمسخدم"
    )
    password: str = Field(
        ..., 
        min_length=6, 
        description="كلمة المرور الخاصة بالحساب"
    )


class RefreshRequest(BaseModel):
    refresh_token: str = Field(
        ..., 
        description="توكن التحديث للحصول على access token جديد دون الحاجة لتسجيل الدخول مرة أخرى"
    )


# ─── نماذج الاستجابة (Response Schemas) ───

class TokenResponse(BaseModel):
    access_token: str = Field(..., description="توكن الوصول القصير الصلاحية والمستخدم في ترويسة الطلبات")
    refresh_token: str = Field(..., description="توكن التحديث طويل الصلاحية")
    token_type: str = Field("bearer", description="نوع التوكن المستخدم في الـ Authorization Header")
    user_id: int = Field(..., description="المعرف الرقمي الفريد للموظف")
    full_name: str = Field(..., description="الاسم الكامل للموظف")
    global_role: GlobalRole = Field(..., description="الصلاحية العامة للمستخدم في النظام")
    managed_department_ids: List[int] = Field(default_factory=list, description="قائمة أرقام الأقسام التي يديرها المستخدم")

    class Config:
        from_attributes = True