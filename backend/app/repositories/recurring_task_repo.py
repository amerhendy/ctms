#app/repositories/recurring_task_repo.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models import RecurringTask, RecurringTaskLog, User
from app.db.enums import GlobalRole
from app.core.permissions import AccessService
class RecurringTaskRepository:
    @staticmethod
    def get_base_query(current_user: User):
        query = select(RecurringTask).where(RecurringTask.deleted_at.is_(None))
        
        # حصر النتائج بناءً على الصلاحيات
        if AccessService.is_pm_or_admin(current_user):
            query = query.where(RecurringTask.department_id == current_user.department_id)
            
        return query

    @staticmethod
    async def get_by_id(db: AsyncSession, template_id: int):
        result = await db.execute(select(RecurringTask).where(RecurringTask.id == template_id, RecurringTask.deleted_at.is_(None)))
        return result.scalar_one_or_none()

    

    @staticmethod
    async def create(db: AsyncSession, template_data: dict):
        template = RecurringTask(**template_data)
        db.add(template)
        return template

    @staticmethod
    async def get_all_by_department(db: AsyncSession, dept_id: int):
        return await db.execute(select(RecurringTask).where(RecurringTask.department_id == dept_id, RecurringTask.deleted_at.is_(None)))

    @staticmethod
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
    async def soft_delete(db: AsyncSession, template: RecurringTask) -> None:
        template.deleted_at = datetime.utcnow()
        await db.commit()