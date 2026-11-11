from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
<<<<<<< HEAD
from typing import List, Optional

from app.db.session import get_db
from app.schemas.departments import DepartmentOut
from app.schemas.locations import LocationCreate, LocationOut, LocationUpdate, LocationTreeOut
from app.core.security import get_current_user
from app.services.location_service import LocationService
from app.models.User import User

=======
from sqlalchemy import select, func, or_
from typing import List, Optional

from app.db.session import get_db
from app.db.enums import GlobalRole
from app.models import User
# استيراد النماذج العامة ونماذج المؤسسة والموظفين
from app.schemas.departments import  DepartmentOut
from app.schemas.locations import LocationCreate, LocationOut,LocationUpdate
from app.core.security import get_current_user
from app.services.location_service import LocationService
from app.models.User import User
from app.repositories.location_repository import LocationRepository
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
router = APIRouter(tags=["locations - مواقع العمل"])

@router.get("/locations", response_model=List[LocationOut])
async def list_locations(
<<<<<<< HEAD
=======
    department_id: Optional[int] = None,
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
<<<<<<< HEAD
    return await LocationService.get_all_locations(db, is_active)


# ─── مسار الشجرة التنظيمية (Location Tree Endpoint) ────────────────────────
@router.get("/locations/tree", response_model=List[LocationTreeOut])
async def get_locations_tree(
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    جلب الهيكل الشجري الكامل للمواقع مع إمكانية التصفية حسب الحالة (نشط/غير نشط أو الكل).
    """
    return await LocationService.get_location_tree(db, is_active)
=======
    service = LocationService(LocationRepository(db))
    return await service.get_all_locations(is_active,department_id)
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172


@router.post("/locations", response_model=LocationOut, status_code=201)
async def create_location(
    data: LocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
<<<<<<< HEAD
    return await LocationService.create_new_location(db, data, current_user)


=======
    service = LocationService(LocationRepository(db))
    return await service.create_new_location(data, current_user)
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
# ─── 1. التعديل (Update Location) ─────────────────────────────────────────
@router.put("/locations/{location_id}", response_model=LocationOut)
async def update_location(
    location_id: int, 
    data: LocationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
<<<<<<< HEAD
    return await LocationService.update_location_service(db, location_id, data, current_user)


# ─── 2. الحذف (Soft Delete/Deactivate) ───────────────────────────────────
=======
    service = LocationService(LocationRepository(db))
    return await service.update_location_service(location_id, data, current_user)


# ─── 2. الحذف (Soft Delete/Deactivate) ───────────────────────────────────
# يفضل دائماً الحذف اللوجيستي بجعل is_active = False بدلاً من الحذف النهائي لحفظ سجل التغييرات والمهام المرتبطة
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
<<<<<<< HEAD
    await LocationService.delete_location_service(db, location_id, current_user)
=======
    service = LocationService(LocationRepository(db))
    await service.delete_location_service(location_id, current_user)
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    return None


# ─── 3. عرض الموظفين في الموقع (Get Users in Location) ─────────────────────
<<<<<<< HEAD
@router.get("/locations/{location_id}/users", response_model=dict)
=======
@router.get("/locations/{location_id}/users", response_model=dict) # تم التوحيد إلى dict لدعم هيكل الـ Pagination
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
async def get_users_in_location(
    location_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
<<<<<<< HEAD
    sort_by: Optional[str] = "full_name",
    sort_order: str = "asc",
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
=======
    sort_by: Optional[str] = "full_name",     # فرز افتراضي حسب الاسم الكامل
    sort_order: str = "asc",                  # ترتيب تصاعدي افتراضي لأسماء الموظفين
    q: Optional[str] = None,                  # شريط البحث الشامل داخل الموقع
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    جلب قائمة بالموظفين التابعين لموقع عمل معين مع دعم الترقيم، الفرز، والبحث الموحد.
    """
    # 1. الرقابة والتحقق: التأكد أولاً من وجود الموقع وصلاحيته
    service = LocationService(LocationRepository(db))
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    params = {
        "page": page, "page_size": page_size, "sort_by": sort_by, 
        "sort_order": sort_order, "search_query": q
    }
<<<<<<< HEAD
    return await LocationService.get_users_paginated(db, current_user, location_id, params)
=======
    return await service.get_users_paginated(location_id, params)
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172


# ─── 4. عرض الإدارات في الموقع (Get Departments in Location) ───────────────
@router.get("/locations/{location_id}/departments", response_model=List[DepartmentOut])
async def get_departments_in_location(
    location_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
<<<<<<< HEAD
    return await LocationService.get_location_departments(db, location_id)
=======
    service = LocationService(LocationRepository(db))
    return await service.get_location_departments(location_id)
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
