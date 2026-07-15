#app/schemas/departments.py
from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from app.db.enums import GlobalRole

from app.schemas.job_levels import JobLevelOut
from app.schemas.locations import LocationOut
class ManagerOut(BaseModel):
    id: int
    full_name: str # أو أي حقل آخر تريده من جدول المستخدمين
    avatar_url:Optional[str] = None

    class Config:
        from_attributes = True

class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    parent_department_id: Optional[int] = None
    job_level_id: Optional[int] = None
    location_id: Optional[int] = None
    is_active: bool = True


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    parent_department_id: Optional[int] = None
    job_level_id: Optional[int] = None
    location_id: Optional[int] = None
    is_active: Optional[bool] = None


class DepartmentOut(BaseModel):
    id: int
    name: str
    parent_department_id: Optional[int]
    job_level_id: Optional[int]
    location_id: Optional[int]
    job_level: Optional[JobLevelOut]
    location: Optional[LocationOut]
    is_active: bool

    class Config:
        from_attributes = True

class DepartmentTreeItem(BaseModel):
    """نموذج خفيف ومثالي لبناء شجرة الهيكل الإداري بالكامل"""
    id: int
    name: str
    parent_department_id: Optional[int] = None
    job_level_id: Optional[int]
    location_id: Optional[int]
    job_level: Optional[JobLevelOut]
    location: Optional[LocationOut]
    is_active: bool
    children: List[DepartmentTreeItem] = []  # ستستقبل المستويات الأدنى تلقائياً
    managers: List[ManagerOut] = []

    class Config:
        from_attributes = True

# لتأكيد ودعم التداخل الذاتي (Self-referencing) في Pydantic v2 بشكل مستقر
DepartmentTreeItem.model_rebuild()