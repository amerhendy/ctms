import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload, with_loader_criteria
from typing import Optional, List
from datetime import datetime, time
from app.db.session import get_db
from app.schemas.task_steps import TaskStepCreate, TaskStepUpdate, TaskStepsReorder, TaskStepToggleResponse
from app.db.enums import TaskStatus
from app.models import (User, Task, TaskStep) 
from app.core.security import get_current_user
from app.core.permissions import require_view_permission, get_task_permissions
from app.schemas.base import PaginatedResponse,task_query_with_relations,get_task_or_404,apply_pagination
from app.services.log_service import LogService
from app.schemas.base import get_task_or_404
from app.schemas.task_steps import StepReorderItem

from app.services.task_step_service import taskStepService
router = APIRouter(prefix="/Steps", tags=["Steps - خطوات المهام"])

# ─── إدارة خطوات المهمة (Steps) ───────────────────────────────────────────────────
@router.post("/{task_id}", status_code=status.HTTP_201_CREATED)
async def add_step(
    task_id: int,
    data: TaskStepCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await taskStepService.create(db, task_id, data, current_user)


@router.patch("/{task_id}/{step_id}")
async def update_step(
    task_id: int,
    step_id: int,
    data: TaskStepUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await taskStepService.update(db, step_id, task_id, data, current_user)

@router.delete("/{task_id}/{step_id}")
async def delete_step(
    task_id: int,
    step_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await taskStepService.delete(db, task_id, step_id, current_user)
@router.patch("/{task_id}/{step_id}/toggle", response_model=TaskStepToggleResponse)
async def toggle_step_status(
    task_id: int,
    step_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await taskStepService.toggle_status(db, task_id, step_id, current_user)
# ─── جلب خطوات المهمة بنظام الترقيم الموحد والديناميكي ─────────────────────────────
@router.get("/{task_id}")
async def get_task_steps(
    task_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. جلب الـ base_query بعد التحقق من الصلاحيات عبر الـ Service
    base_query = await taskStepService.get_paginated_steps(db, task_id, current_user)

    # 2. استخدام محركك الديناميكي
    paginated_result = await apply_pagination(
        db=db,
        base_query=base_query,
        model_class=TaskStep,
        page=page,
        page_size=limit
    )

    # 3. إضافة الـ helper لزر Load More
    paginated_result["has_more"] = page < paginated_result.get("pages", 1)

    return paginated_result

@router.put("/{task_id}/reorder")
async def reorder_steps(
    task_id: int,
    data: TaskStepsReorder,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await taskStepService.reorder(db, task_id, data.steps, current_user)