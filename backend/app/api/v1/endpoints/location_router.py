from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.session import get_db
from app.schemas.departments import DepartmentOut
from app.schemas.locations import LocationCreate, LocationOut, LocationUpdate, LocationTreeOut
from app.core.security import get_current_user
from app.services.location_service import LocationService
from app.models.User import User

router = APIRouter(tags=["locations - مواقع العمل"])

@router.get("/locations", response_model=List[LocationOut])
async def list_locations(
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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


@router.post("/locations", response_model=LocationOut, status_code=201)
async def create_location(
    data: LocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await LocationService.create_new_location(db, data, current_user)


# ─── 1. التعديل (Update Location) ─────────────────────────────────────────
@router.put("/locations/{location_id}", response_model=LocationOut)
async def update_location(
    location_id: int, 
    data: LocationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await LocationService.update_location_service(db, location_id, data, current_user)


# ─── 2. الحذف (Soft Delete/Deactivate) ───────────────────────────────────
@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await LocationService.delete_location_service(db, location_id, current_user)
    return None


# ─── 3. عرض الموظفين في الموقع (Get Users in Location) ─────────────────────
@router.get("/locations/{location_id}/users", response_model=dict)
async def get_users_in_location(
    location_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = "full_name",
    sort_order: str = "asc",
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    params = {
        "page": page, "page_size": page_size, "sort_by": sort_by, 
        "sort_order": sort_order, "search_query": q
    }
    return await LocationService.get_users_paginated(db, current_user, location_id, params)


# ─── 4. عرض الإدارات في الموقع (Get Departments in Location) ───────────────
@router.get("/locations/{location_id}/departments", response_model=List[DepartmentOut])
async def get_departments_in_location(
    location_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await LocationService.get_location_departments(db, location_id)