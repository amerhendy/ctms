# app/api/v1/endpoints/workflow.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.User import User
from app.models import (WorkflowTemplate, WorkflowTemplateStep)
from app.schemas.WorkflowTemplate_schema import WorkflowTemplateCreate,WorkflowTemplateOut,WorkflowTemplateUpdate
from app.schemas.WorkflowTemplateStep_schema import TemplateStepCreate
from app.schemas.TaskWorkflow_schema import WorkflowCreate,WorkflowOut,WorkflowStepOut
from app.schemas.TaskWorkflowStep_schema import WorkflowStepOut,WorkflowStepComplete,WorkflowStepUpdate
from app.services.TaskWorkflow_service import TaskWorkflowService
from app.services.TaskWorkflowStep_service import TaskWorkflowStepService
from app.services.access_service import AccessService
from app.repositories.task_repo import TaskRepository
from sqlalchemy import select
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/workflow", tags=["Workflow"])
# ══════════════════════════════════════════════════════════════════════════════
# خطوات الـ Workflow
# ══════════════════════════════════════════════════════════════════════════════
#عمل روت لتغيير حالة الخطوة
@router.post("/test/{step_id}", status_code=204)
async def test(
    step_id: int,
    notes:str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """اختبارات"""
    return await TaskWorkflowStepService.complete_step(db,step_id,notes,current_user)
    