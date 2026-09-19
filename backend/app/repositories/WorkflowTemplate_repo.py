from sqlalchemy import select, update,func
from app.models.WorkflowTemplateModel import WorkflowTemplate
from sqlalchemy.orm import selectinload,joinedload
class WorkflowTemplateRepository:
    @staticmethod
    def base_query():
        return select(WorkflowTemplate).options(
            selectinload(WorkflowTemplate.steps),
            joinedload(WorkflowTemplate.creator)
        ).where(WorkflowTemplate.deleted_at.is_(None))

    @staticmethod
    async def create(db, template_data: dict):
        template = WorkflowTemplate(**template_data)
        db.add(template)
        await db.flush()
        return template

    @staticmethod
    async def get_by_id(db, template_id: int):
        stmt = WorkflowTemplateRepository.base_query().where(WorkflowTemplate.id == template_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_by_name(db, name: str):
        stmt = WorkflowTemplateRepository.base_query().where(WorkflowTemplate.name == name)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def list_all(db):
        stmt = WorkflowTemplateRepository.base_query()
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def update(db, template, data):
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(template, key, value)
        return template

    @staticmethod
    async def toggle_active(db, template):
        template.is_active = not template.is_active
        return template
    
    @staticmethod
    async def delete(db, template):
        template.deleted_at = func.now()
        return template