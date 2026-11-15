# app/api/v1/endpoints/user_stats.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from datetime import date
from typing import Optional
from app.core.security import get_current_user
from app.models.User import User
from app.repositories.user_repository import UserRepository
from app.services.user_stats_service import UserStatsService
from app.schemas.user_stats_schema import UserStatsResponse
from app.services.permission_service import can_view_user,can_view_department
#from app.services.permission_service import PermissionService


router = APIRouter(prefix="/stats", tags=["User Stats - احصائيات المستخدم"])

@router.get("/me", response_model=UserStatsResponse, operation_id="get_current_user_stats")
async def get_my_stats(
    start_date: Optional[date] = Query(None, description="تاريخ البداية"),
    end_date: Optional[date] = Query(None, description="تاريخ النهاية"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """إحصائيات المستخدم الحالي"""
    return await UserStatsService.get_dashboard_summary(db, current_user.id, start_date, end_date)

@router.get("/users/{user_id}", response_model=UserStatsResponse, operation_id="get_specific_user_stats")
async def get_user_stats(
    user_id: int,
    start_date: Optional[date] = Query(None, description="تاريخ البداية"),
    end_date: Optional[date] = Query(None, description="تاريخ النهاية"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """إحصائيات مستخدم آخر (مع التحقق من الصلاحية)"""
    # تحقق من الصلاحية (يمكن إضافة دالة can_view_user قريباً)
    # لاحظ أننا لم نكتب can_view_user بعد، سنضيفها في service منفصلة
    # لكن حالياً نسمح فقط للمستخدم نفسه أو GLOBAL_ADMIN
    if not await can_view_user(db,current_user, user_id):
        raise HTTPException(status_code=403, detail="Not enough permissions to view this user's stats")
    return await UserStatsService.get_dashboard_summary(db, user_id, start_date, end_date)


@router.get("/department/{department_id}", response_model=UserStatsResponse, operation_id="get_department_stats")
async def get_department_stats(
    department_id: int,
    start_date: Optional[date] = Query(None, description="تاريخ البداية"),
    end_date: Optional[date] = Query(None, description="تاريخ النهاية"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """إحصائيات كاملة للإدارة بناءً على الهيكل التنظيمي."""
    
    # 1. التحقق من صلاحية رؤية الإدارة (سنحتاج دالة مشابهة لـ can_view_user)
    if not await can_view_department(db, current_user, department_id):
        raise HTTPException(status_code=403, detail="Not enough permissions to view this department's stats")
    
    # 2. استدعاء الخدمة المخصصة للإدارات
    return await UserStatsService.get_department_summary(db, department_id, start_date, end_date)