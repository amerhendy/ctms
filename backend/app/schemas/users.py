from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from app.db.session import Base
from app.db.enums import GlobalRole

# استيراد النماذج المرتبطة لتفادي مشاكل التحميل
from app.schemas.departments import DepartmentOut
from app.schemas.job_levels import JobLevelOut
from app.schemas.notification_settings import NotificationSettingsOut
from app.schemas.user_logs import UserLogOut
from app.schemas.user_contacts import UserContactOut
# ─── نماذج الإدخال والتحديث (Request Schemas) ───
class UserCreate(BaseModel):
    employee_number: str = Field(..., min_length=1, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=255)
    job_title: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6)
    work_location_id: Optional[int] = None
    #manager_id: Optional[int] = None
    job_level_id: Optional[int] = None
    department_id: Optional[int] = None
    global_role: GlobalRole = GlobalRole.USER
    can_transfer_external: bool = False


class UserUpdate(BaseModel):
    employee_number: Optional[str] = Field(None, min_length=1, max_length=50)
    full_name: Optional[str] = None
    job_title: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6, description="كلمة المرور الجديدة اختياري")
    work_location_id: Optional[int] = None
    #manager_id: Optional[int] = None
    job_level_id: Optional[int] = None
    department_id: Optional[int] = None
    global_role: Optional[GlobalRole] = None
    can_transfer_external: Optional[bool] = None
    is_active: Optional[bool] = None
    google_id: Optional[str] = Field(None, description="معرف جوجل الفريد لربط الحساب")
    avatar_url: Optional[str] = None


class UserPasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)

class TraditionalLoginRequest(BaseModel):
    """سكيما الدخول التقليدي - تدمج البريد والرقم الوظيفي في حقل واحد لمرونة الدخول"""
    username_or_email: str = Field(..., min_length=1, description="البريد الإلكتروني للموظف أو الرقم الوظيفي")
    password: str = Field(..., min_length=6)


class GoogleLoginRequest(BaseModel):
    """سكيما الدخول بجوجل - تستقبل التوكن القادم من المتصفح للتحقق منه"""
    credential: str = Field(..., description="رمز التحقق (ID Token) القادم من جيتواي جوجل")

# ─── نماذج المخرجات (Response Schemas) ───

class UserOut(BaseModel):
    id: int
    employee_number: str
    full_name: str
    job_title: str
    email: str
    work_location_id: Optional[int]
    job_level_id: Optional[int]
    department_id: Optional[int]
    global_role: GlobalRole
    can_transfer_external: bool
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime
    google_id: Optional[str] = None
    department: Optional[DepartmentOut] = None
    job_level: Optional[JobLevelOut] = None
    avatar_url: Optional[str] = None
    notification_settings: Optional[NotificationSettingsOut] = None
    logs: List[UserLogOut] = []
    contacts: Optional[UserContactOut] = None
    managed_department_ids: List[int] = Field(default_factory=list, description="قائمة أرقام الأقسام التي يديرها المستخدم")

    class Config:
        from_attributes = True


class UserSummary(BaseModel):
    id: int
    employee_number: str
    full_name: str
    job_title: str
    email: str
    department_id: Optional[int]
    job_level_id: Optional[int]
    google_id: Optional[str] = None
    avatar_url: Optional[str] = None
    contacts: Optional[UserContactOut] = None
    

    class Config:
        from_attributes = True


class UserCheckResponse(BaseModel):
    exists: bool = Field(..., description="هل القيمة موجودة مسبقاً في النظام؟")
    field: str = Field(..., description="اسم الحقل الذي تم فحصه (email أو employee_number)")


class DepartmentUserCount(BaseModel):
    department_id: Optional[int]
    department_name: Optional[str]
    count: int


class UserStatsOut(BaseModel):
    total_users: int = Field(..., description="إجمالي الموظفين بالنظام")
    active_users: int = Field(..., description="عدد الموظفين النشطين")
    inactive_users: int = Field(..., description="عدد الحسابات المعطلة")
    department_distribution: List[DepartmentUserCount] = Field(..., description="توزيع الموظفين على الأقسام")

    class Config:
        from_attributes = True
        