import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.db.session import get_db

from app.models import (User) 
from app.core.security import get_current_user
from app.schemas.base import get_task_or_404
from app.schemas.task_steps import TaskStepCreate, TaskStepUpdate, TaskStepOut, TaskStepToggleResponse,StepReorderItem
from app.services.task_step_service import TaskStepService
from app.db.enums import StepStatus
from fastapi import BackgroundTasks
router = APIRouter(prefix="/Steps", tags=["Steps - خطوات المهام"])

# ─── إدارة خطوات المهمة (Steps) ───────────────────────────────────────────────────
# 1. إضافة خطوة جديدة (Create Step)
@router.post("/{task_id}", response_model=List[TaskStepOut], status_code=http_status.HTTP_201_CREATED)
async def add_step(
    task_id: int,
    data: TaskStepCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await TaskStepService.create(db, task_id, data, current_user,background_tasks)


# 2. جلب خطوات المهمة (Get Task Steps)
@router.get("/{task_id}")
async def get_task_steps(
    task_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TaskStepService.get_steps_by_task(db, task_id, current_user)

# 3. تحديث بيانات خطوة (Update Step)
@router.patch("/{task_id}/{step_id}", response_model=TaskStepOut)
async def update_step(
    step_id: int,
    task_id:int,
    data: TaskStepUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await TaskStepService.update(db, task_id,step_id, data, current_user,background_tasks)

# 4. تغيير الحالة (Toggle/Status Update)
@router.patch("/{task_id}/{step_id}/status", response_model=TaskStepToggleResponse)
async def change_step_status(
    step_id: int,
    task_id:int,
    background_tasks: BackgroundTasks,
    status: StepStatus, # سيتم تمريره في الـ Query أو Body
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await TaskStepService.change_status(db,task_id, step_id, status, current_user,background_tasks)

# 5. إعادة ترتيب الخطوات
@router.put("/{task_id}/reorder", status_code=http_status.HTTP_200_OK)
async def reorder_steps(
    task_id: int,
    background_tasks: BackgroundTasks,
    steps: List[StepReorderItem],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await TaskStepService.reorder(db, task_id, steps, current_user,background_tasks)
    return {"message": "تم إعادة ترتيب الخطوات بنجاح"}

#6. حذف خطوة (Delete Step)
@router.delete("/{task_id}/{step_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_step(
    step_id: int,
    task_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await TaskStepService.delete(db,task_id, step_id, current_user,background_tasks)
    return None


