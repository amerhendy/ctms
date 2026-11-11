#app/api/v1/endpoints/organization.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.session import get_db
# استيراد النماذج العامة ونماذج المؤسسة والموظفين
from app.schemas.base import PaginatedResponse
from app.schemas.users import UserSummary
from app.core.permissions import AccessService
from app.schemas.departments import DepartmentTreeItem,DepartmentCreate, DepartmentUpdate, DepartmentOut
from app.core.security import get_current_user
from app.models.User import User
from app.services.department_service import DepartmentService
router = APIRouter(tags=["Organization - المؤسسة والهيكل الإداري"])

@router.get("/departments", response_model=dict) # تم التحويل إلى dict لاستيعاب كائن الـ Pagination
async def list_departments(
    parent_id: Optional[int] = None,
    is_active: Optional[bool] = True,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=0, le=100),
    sort_by: Optional[str] = "name",          # فرز افتراضي حسب اسم القسم أبجدياً
    sort_order: str = "asc",                  # ترتيب تصاعدي افتراضي للأقسام
    q: Optional[str] = None,                  # شريط البحث الشامل
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    جلب قائمة بالأقسام متوافقة بالكامل مع محرك الترقيم والبحث الموحد.
    """
    params = {
        "parent_id": parent_id, "is_active": is_active, "page": page,
        "page_size": page_size, "sort_by": sort_by, "sort_order": sort_order, "q": q
    }
    return await DepartmentService.list_departments(db, params)


# رابط جلب الأقسام خفيفة الوزن للمنسدلات (مستحدث لسرعة الفرونت إند)
@router.get("/departments/kv")
async def list_departments_kv(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """إرجاع قائمة سريعة وخفيفة بالأقسام النشطة (المعرف والاسم فقط)"""
    return await DepartmentService.get_departments_kv(db)


# تصحيح خوارزمية الشجرة لجلب كافة المستويات التابعة ديناميكياً
@router.get("/departments/tree", response_model=List[DepartmentTreeItem])
async def get_departments_tree(
    department_id: Optional[List[int]] = Query(None),
    location_id: Optional[int] = Query(None, description="جلب أقسام موقع معين"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    جلب الهيكل الشجري للأقسام:
    - بدون معاملات: جلب الشجرة كاملة.
    - مع department_id: جلب الفرع التابع لهذا القسم.
    - مع location_id: جلب كافة الأقسام التابعة لهذا الموقع.
    """
    return await DepartmentService.get_department_tree_filtered(
        db, 
        department_ids=department_id, 
        location_ids=location_id
    )


@router.post("/departments", response_model=DepartmentOut, status_code=201)
async def create_department(
    data: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    AccessService.require_pm_or_admin(current_user)
    return await DepartmentService.create_department(db, data, current_user.id)


@router.get("/departments/{dept_id}", response_model=DepartmentOut)
async def get_department(
    dept_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DepartmentService.get_department_by_id(db, dept_id)


# رابط جلب موظفي القسم بالاعتماد على الـ Pagination العام والذكي (مستحدث ومهم جداً للوحة التحكم)
@router.get("/departments/{dept_id}/users", response_model=PaginatedResponse[UserSummary])
async def get_department_users(
    dept_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """جلب كافة الموظفين المنتمين لقسم معين مع دعم كامل للتصفح والصفحات"""
    return await DepartmentService.get_dept_users(db, dept_id, page, page_size) 


@router.patch("/departments/{dept_id}", response_model=DepartmentOut)
async def update_department(
    dept_id: int,
    data: DepartmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    AccessService.require_pm_or_admin(current_user)
    return await DepartmentService.update_department(db, dept_id, data, current_user.id)


# تحويل الـ Delete التقليدي إلى رابط تبديل حالة الحساب الذكي Toggle Active (مستحدث ومؤمن)
@router.patch("/departments/{dept_id}/toggle-active", response_model=DepartmentOut)
async def toggle_department_active_status(
    dept_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """تبديل حالة نشاط القسم (تفعيل / إيقاف مؤقت) مع حماية سلامة الموظفين بالداخل"""
    AccessService.require_pm_or_admin(current_user)
    return await DepartmentService.toggle_department_status(db, dept_id)


@router.delete("/departments/{dept_id}")
async def delete_department(
    dept_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """رابط الحذف الناعم التقليدي (تم تزويده بالـ Commit لإثبات التعديل بالسيستم)"""
    AccessService.require_pm_or_admin(current_user)
    return await DepartmentService.delete_department(db, dept_id)