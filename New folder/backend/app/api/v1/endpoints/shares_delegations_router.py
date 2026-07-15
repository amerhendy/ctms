#api/v1/endpoints/shares_delegations.py
"""
Shares API – Task sharing with permission levels
Delegations API – Authority delegation between managers
"""
from fastapi import APIRouter, Depends,BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.models.User import User
from app.schemas.shares import ShareCreate,TaskShareOut
from app.schemas.delegations import DelegationCreate

from app.core.security import get_current_user
from app.services.share_service import ShareService
from app.services.delegation_service import DelegationService
shares_router = APIRouter(prefix="/shares", tags=["Task Shares"])
delegations_router = APIRouter(prefix="/delegations", tags=["Delegations"])


# ─── Shares ──────────────────────────────────────────────────

@shares_router.post("", status_code=201)
async def share_task(
    data: ShareCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """مشاركة مهمة مع مستخدم (من نفس القسم أو خارجي)."""
    return await ShareService.share_task(db=db,data=data,current_user=current_user,background_tasks=background_tasks)


@shares_router.get("/task/{task_id}", response_model=List[TaskShareOut])
async def get_task_shares(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """جلب قائمة المشاركات لمهمة محددة (يتطلب صلاحية عرض المهمة)."""
    return await ShareService.get_task_shares(db, task_id, current_user)


@shares_router.delete("/{share_id}")
async def revoke_share(
    share_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """إلغاء مشاركة مهمة (حذف المشاركة)."""
    return await ShareService.revoke_share(db, share_id, current_user)


# ─── Delegations ─────────────────────────────────────────────

@delegations_router.post("", status_code=201)
async def create_delegation(
    data: DelegationCreate,
    background_tasks:BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delegate permissions to another user."""
    return await DelegationService.create_delegation(db, data, current_user, background_tasks)


@delegations_router.get("/my")
async def my_delegations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get delegations given by or received by current user."""
    return await DelegationService.get_my_delegations(db, current_user)


@delegations_router.delete("/{delegation_id}")
async def revoke_delegation(
    delegation_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DelegationService.revoke_delegation(db, delegation_id, current_user, background_tasks)