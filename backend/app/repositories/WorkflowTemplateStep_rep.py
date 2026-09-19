from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete,func
from app.models.WorkflowTemplateStepModel import WorkflowTemplateStep

class WorkflowTemplateStepRepository:
    @staticmethod
    def base_query():
        return select(WorkflowTemplateStep).where(WorkflowTemplateStep.deleted_at.is_(None))
    
    @staticmethod
    async def get_step_by_id(db, step_id: int):
        stmt = WorkflowTemplateStepRepository.base_query().where(WorkflowTemplateStep.id == step_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db, step_data):
        step = WorkflowTemplateStep(**step_data)
        db.add(step)
        await db.flush()
        return step
    
    @staticmethod
    async def createMultiple(db: AsyncSession, data: dict) -> WorkflowTemplateStep:
        data.pop('id', None) 
        step = WorkflowTemplateStep(**data)
        db.add(step)
        await db.flush() # يقوم بتوليد الـ ID في الذاكرة دون حفظه نهائياً في قاعدة البيانات حتى الآن
        await db.refresh(step)
        return step

    @staticmethod
    async def get_steps_by_template(db, template_id: int):
        stmt = WorkflowTemplateStepRepository.base_query().where(
            WorkflowTemplateStep.template_id == template_id
        ).order_by(WorkflowTemplateStep.step_order)
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def update(db, step, data):
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(step, key, value)
        return step

    @staticmethod
    async def delete(db, step):
        step.deleted_at = func.now() # Soft delete
        return step