import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status as http_status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field,field_validator
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload, with_loader_criteria
from typing import Optional, List

from app.db.session import get_db
from app.db.enums import AssignmentType,TaskActionType
from app.core.security import get_current_user
from app.models import (User, TaskAssignment) 
from app.services.taskassignment_service import taskAsignmentService

router = APIRouter(prefix="/assignment", tags=["Task Assignment - منفذون المهام"])
# ─── تعيين وإلغاء تعيين الموظفين (Assignments) ─────────────────────────────────────────────

@router.post("/{task_id}")
async def assign_user(
    task_id: int,
    user_id: int,
    background_tasks:BackgroundTasks,
    assignment_type: AssignmentType = AssignmentType.ASSIGNEE,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    إضافة موظف جديد وتعيينه للعمل على هذه المهمة بشكل رسمي مع توثيق الحركة كـ JSON وإرسال الإشعار.
    """
    return await taskAsignmentService.assign_user(
        db=db,
        current_user=current_user,
        task_id=task_id,
        user_id=user_id,
        assignment_type=assignment_type,
        background_tasks=background_tasks
        )


@router.delete("/{task_id}/{user_id}")
async def unassign_user(
    task_id: int,
    user_id: int,
    background_tasks:BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    إلغاء تعيين موظف من المهمة (Soft Delete) مع توثيق الحركة كـ JSON وإرسال إشعار للموظف.
    """
    return await taskAsignmentService.unassign_user(
        db=db,
        current_user=current_user,
        task_id=task_id,
        user_id=user_id,
        background_tasks=background_tasks
        )
    


@router.post("/{task_id}/{user_id}/restore")
async def restore_assignment(
    task_id: int,
    user_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    استعادة تعيين موظف محذوف سابقاً (Undo Soft Delete) وتوثيق الحركة كـ JSON وإرسال إشعار.
    """
    return await taskAsignmentService.restore_assignment(db, current_user, task_id, user_id, background_tasks)
    

@router.get("/{task_id}", response_model=List[dict])
async def get_task_assignments(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    جلب قائمة بجميع الموظفين المكلفين بالمهمة حالياً (التعيينات النشطة فقط).
    يتم تحميل بيانات المستخدم (user) والموظف المسؤول عن التكليف (assigner) تلقائياً.
    """
    return await taskAsignmentService.get_task_assignments(db, task_id)