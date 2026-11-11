#app/repositories/recurring_task_repo.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
<<<<<<< HEAD
from sqlalchemy.orm import selectinload

from datetime import datetime
from typing import Optional

from app.models import RecurringTaskLog, User
from app.models.RecurringTaskModel import RecurringTask
from app.models.RecurringTaskStepModel import RecurringTaskStep
=======
from app.models import RecurringTask, RecurringTaskLog, User
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
from app.db.enums import GlobalRole
from app.core.permissions import AccessService
class RecurringTaskRepository:
    @staticmethod
<<<<<<< HEAD
    def get_base_query(current_user: User, include_deleted: bool = False):
        query = select(RecurringTask).options(
            selectinload(RecurringTask.steps.and_(RecurringTaskStep.deleted_at.is_(None)))
        )
        
        if not include_deleted:
            query = query.where(RecurringTask.deleted_at.is_(None))
        
=======
    def get_base_query(current_user: User):
        query = select(RecurringTask).where(RecurringTask.deleted_at.is_(None))
        
        # حصر النتائج بناءً على الصلاحيات
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
        if AccessService.is_pm_or_admin(current_user):
            query = query.where(RecurringTask.department_id == current_user.department_id)
            
        return query
<<<<<<< HEAD
    @staticmethod
    def get_base_query_trash(current_user: User):
        query = select(RecurringTask).options(
            selectinload(RecurringTask.steps.and_(RecurringTaskStep.deleted_at.is_(None)))
        )
        query = query.where(RecurringTask.deleted_at.isnot(None))
        
        if AccessService.is_pm_or_admin(current_user):
            query = query.where(RecurringTask.department_id == current_user.department_id)
            
        return query
    @staticmethod
    async def get_by_id(db: AsyncSession, template_id: int, include_deleted: bool = False) -> Optional[RecurringTask]:
        query = select(RecurringTask).options(
            selectinload(RecurringTask.steps.and_(RecurringTaskStep.deleted_at.is_(None)))
        ).where(RecurringTask.id == template_id)
        
        if not include_deleted:
            query = query.where(RecurringTask.deleted_at.is_(None))
            
        result = await db.execute(query)
=======

    @staticmethod
    async def get_by_id(db: AsyncSession, template_id: int):
        result = await db.execute(select(RecurringTask).where(RecurringTask.id == template_id, RecurringTask.deleted_at.is_(None)))
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
        return result.scalar_one_or_none()

    

    @staticmethod
<<<<<<< HEAD
    async def create(db: AsyncSession, template_data: dict) -> RecurringTask:
        steps_data = template_data.pop("steps", [])
        template = RecurringTask(**template_data)
        
        for step_dict in steps_data:
            step = RecurringTaskStep(**step_dict)
            template.steps.append(step)
            
=======
    async def create(db: AsyncSession, template_data: dict):
        template = RecurringTask(**template_data)
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
        db.add(template)
        return template

    @staticmethod
<<<<<<< HEAD
    async def update(db: AsyncSession, template: RecurringTask, update_data: dict) -> RecurringTask:
        for key, value in update_data.items():
            setattr(template, key, value)
        await db.commit()
        await db.refresh(template)
        return template

    @staticmethod
    async def soft_delete_with_steps(db: AsyncSession, template: RecurringTask, deleted_time: datetime) -> None:
        template.deleted_at = deleted_time
        for step in template.steps:
            step.deleted_at = deleted_time
        await db.commit()

    @staticmethod
    async def restore_with_steps(db: AsyncSession, template: RecurringTask) -> None:
        template.deleted_at = None
        for step in template.steps:
            step.deleted_at = None
        await db.commit()

    @staticmethod
    def get_logs_base_query():
        return select(RecurringTaskLog, RecurringTask.title.label("template_title")) \
               .join(RecurringTask, RecurringTaskLog.recurring_task_id == RecurringTask.id)
    
    @staticmethod
=======
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    async def get_all_by_department(db: AsyncSession, dept_id: int):
        return await db.execute(select(RecurringTask).where(RecurringTask.department_id == dept_id, RecurringTask.deleted_at.is_(None)))

    @staticmethod
<<<<<<< HEAD
=======
    async def soft_delete(db: AsyncSession, template: RecurringTask, now):
        template.deleted_at = now

    @staticmethod
    def get_logs_base_query():
        # نستخدم join لجلب معلومات القالب مع الـ Log
        return select(RecurringTaskLog, RecurringTask.title.label("template_title")) \
               .join(RecurringTask, RecurringTaskLog.recurring_task_id == RecurringTask.id)

    @staticmethod
    async def update(db: AsyncSession, template: RecurringTask, update_data: dict) -> RecurringTask:
        for key, value in update_data.items():
            setattr(template, key, value)
        # SQLAlchemy يقوم بتحديث updated_at تلقائياً إذا كان الإعداد onupdate=func.now() موجوداً في الموديل
        await db.commit()
        await db.refresh(template)
        return template

    @staticmethod
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    async def soft_delete(db: AsyncSession, template: RecurringTask) -> None:
        template.deleted_at = datetime.utcnow()
        await db.commit()