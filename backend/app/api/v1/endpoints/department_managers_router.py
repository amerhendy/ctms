from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.session import get_db
from app.models import User
from app.core.security import get_current_user
from app.services.department_manager_service import DeptManagerService
from app.schemas.department_manager_sch import AssignManagerSchema, DepartmentManagersListOut,ManagerOut    

router = APIRouter(prefix="/department-managers", tags=["Department Managers"])

# 1. تعيين مدير (مع منطق الاستبدال التلقائي واللوج)
@router.post("", status_code=status.HTTP_201_CREATED)
async def assign_manager(
    payload: AssignManagerSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """تعيين رئيس للادارة"""
    return await DeptManagerService.assign_manager(
        db, 
        payload.department_id, 
        payload.user_id, 
        current_user,
        payload.is_primary # القيمة الجديدة
    )

# 2. جلب المديرين لقسم معين (للـ Modal)
@router.get("/{dept_id}", response_model=DepartmentManagersListOut)
async def get_dept_managers(
    dept_id: int,
    db: AsyncSession = Depends(get_db)
):
    managers = await DeptManagerService.get_managers_by_dept(db, dept_id)
    return {"department_id": dept_id, "managers": managers}

# 3. حذف مدير
@router.delete("/{dept_id}/{user_id}")
async def remove_manager(
    dept_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await DeptManagerService.remove_manager(db, dept_id, user_id, current_user)

# 4. التبديل بين مدير رئيسي ومساعد
@router.patch("/{dept_id}/{user_id}/toggle-role")
async def toggle_manager_role(
    dept_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await DeptManagerService.toggle_role(db, dept_id, user_id, current_user)

# 5. جلب كل الإدارات التي يديرها المستخدم الحالي (للـ Dashboard/Navbar)
@router.get("/my-managed-departments")
async def get_my_managed_departments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await DeptManagerService.get_my_managed_departments(db, current_user.id)

@router.post("/{dept_id}/replace-primary")
async def replace_primary_manager(
    dept_id: int,
    new_manager_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """استبدال المدير الرئيسي"""
    return await DeptManagerService.replace_primary_manager(
        db, dept_id, new_manager_id, current_user
    )