# app/api/v1/endpoints/workflow.py
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.models import User
from app.services.TaskWorkflowStep_service import TaskWorkflowStepService
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.schemas.TaskWorkflowStep_schema import WorkflowStepOut,WorkflowStepComplete,WorkflowStepUpdate, WorkflowStepCreate
from app.db.session import get_db
from app.core.security import get_current_user
router = APIRouter(prefix="/workflow-Steps", tags=["Workflow Steps"])

@router.post("/{workflow_id}", response_model=WorkflowStepOut, status_code=201)
async def create_workflow_step(
    workflow_id: int,
    data: WorkflowStepCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)):
    """إنشاء خطوة جديدة في Workflow"""
    return await TaskWorkflowStepService.create_step(db, workflow_id, data, current_user)


@router.post("/{step_id}/complete", response_model=WorkflowStepOut)
async def complete_step(
    step_id: int,
    notes: Optional[str],
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Endpoint لإتمام خطوة في الـ Workflow.
    سيتأكد تلقائياً من الاعتماديات (Dependencies) ويرسل التنبيهات.
    """
    try:
        updated_step = await TaskWorkflowStepService.complete_step(
            db=db,
            step_id=step_id,
            notes=notes,
            current_user=current_user
        )
        return updated_step
        
    except HTTPException as e:
        # إعادة رسالة الخطأ (مثل: "الخطوة السابقة لم تكتمل") كما هي
        raise e
    except Exception as e:
        # معالجة أي خطأ غير متوقع
        raise HTTPException(status_code=500, detail="حدث خطأ داخلي أثناء معالجة الخطوة")
    
@router.patch("/{step_id}", response_model=WorkflowStepOut)
async def update_step(
    step_id: int,
    data: WorkflowStepUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """تعديل خطوة (قبل ما تبدأ فقط)"""
    step = await TaskWorkflowStepService.get_step_by_id(db, step_id)
    if not step:
        raise HTTPException(404, "الخطوة غير موجودة")

    step = await TaskWorkflowStepService.update_step(db, step, data, current_user)
    await db.commit()
    return step

@router.delete("/{step_id}", status_code=204)
async def delete_step(
    step_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """حذف خطوة (قبل ما تبدأ فقط)"""
    step = await TaskWorkflowStepService.get_step_by_id(db, step_id)
    if not step:
        raise HTTPException(404, "الخطوة غير موجودة")

    await TaskWorkflowStepService.delete_step(db, step, current_user)
    await db.commit()

@router.get("/{step_id}", response_model=WorkflowStepOut)
async def get_step_by_id(
    step_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """جلب خطوة معينة بالـ ID"""
    step = await TaskWorkflowStepService.get_step_by_id(db, step_id)
    if not step:
        raise HTTPException(404, "الخطوة غير موجودة")
    return step