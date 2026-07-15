from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.WorkflowTemplateStep_schema import TemplateStepCreate, TemplateStepOut
from app.services.WorkflowTemplateStepService import WorkflowTemplateStepService

router = APIRouter(prefix="/workflow-templates/{template_id}/steps", tags=["Workflow Template Steps"])

@router.post("/", response_model=TemplateStepOut)
async def add_step(template_id: int, data: TemplateStepCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    return await WorkflowTemplateStepService.add_step_to_template(db, template_id, data, user)

@router.post("/bulk", response_model=List[TemplateStepOut])
async def add_steps(
    template_id: int, 
    data: List[TemplateStepCreate],
    db: AsyncSession = Depends(get_db), 
    user = Depends(get_current_user)
):
    return await WorkflowTemplateStepService.add_multiple_steps(db, template_id, data, user)

@router.patch("/{step_id}")
async def update_step(step_id: int, data: TemplateStepCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    # ملاحظة: يمكنك إنشاء Schema خاص للتحديث
    return await WorkflowTemplateStepService.update_step(db, step_id, data, user)

@router.delete("/{step_id}")
async def delete_step(step_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    return await WorkflowTemplateStepService.delete_step(db, step_id, user)

@router.post("/reorder")
async def reorder_steps(template_id: int, new_order: list[int], db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    return await WorkflowTemplateStepService.reorder_steps(db, template_id, new_order, user)