from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload,selectinload
from sqlalchemy import select, update, or_, delete
from app.models.TaskStep import TaskStep
from app.models.Department import Department
from typing import List, Dict, Any
from app.schemas.task_steps import StepReorderItem
from datetime import datetime
from app.models.TaskStepDependency_Model import TaskStepDependency
class TaskStepRepository:
    @staticmethod
    def get_base_query_for_task(task_id: int):
        """إرجاع استعلام أساسي مع جاهزية للعلاقات (Relationships)"""
        stmt=select(TaskStep).where(TaskStep.task_id == task_id, TaskStep.deleted_at.is_(None))
        #add options
        stmt=TaskStepRepository.getBaseQueryOptions(stmt)
        #order
        stmt=stmt.order_by(TaskStep.step_order.asc(), TaskStep.id.asc())
        return stmt

    @staticmethod
    def getBaseQueryOptions(stmt):
        return stmt.options(
                    selectinload(TaskStep.department).selectinload(Department.job_level),
                    selectinload(TaskStep.children).selectinload(TaskStep.children), # تحميل الأبناء والمستوى الذي يليهم
                    selectinload(TaskStep.children).selectinload(TaskStep.assignee),
                    selectinload(TaskStep.children).selectinload(TaskStep.department),
                    selectinload(TaskStep.assignee),
                )
    @staticmethod
    async def create(db: AsyncSession, step: TaskStep):
        db.add(step)
        await db.flush()
        await db.refresh(step) # للحصول على الحقول المنشأة تلقائياً
        return step

    @staticmethod
    async def update(db: AsyncSession, step_id: int, data: Dict[str, Any]):
        """تحديث بيانات الخطوة مع الحقول الجديدة"""
        # ملاحظة: سنعتمد على دالة update المباشرة لتحسين الأداء
        await db.execute(
            update(TaskStep)
            .where(TaskStep.id == step_id)
            .values(**data)
        )
        await db.flush()


    @staticmethod
    async def delete(db: AsyncSession, step_id: int):
        now_time = datetime.now()
        
        # 1. وسم الخطوة كمحذوفة Soft Delete
        stmt_step = update(TaskStep).where(TaskStep.id == step_id).values(deleted_at=now_time)
        await db.execute(stmt_step)
        
        # 2. مسح التبعيات تماماً لمنع قفل الخطوات الأخرى النشطة
        stmt_dep = delete(TaskStepDependency).where(
            or_(
                TaskStepDependency.parent_step_id == step_id,
                TaskStepDependency.child_step_id == step_id
            )
        )
        await db.execute(stmt_dep)

    @staticmethod
    async def bulk_update_order(db: AsyncSession, steps: List[StepReorderItem]):
        """تحديث جماعي للترتيب"""
        for item in steps:
            await db.execute(
                update(TaskStep)
                .where(TaskStep.id == item.id, TaskStep.deleted_at.is_(None))
                .values(step_order=item.step_order)
            )
        await db.flush()

    @staticmethod
    async def get_by_id(db: AsyncSession, step_id: int, task_id:int= None) -> TaskStep:
        """جلب خطوة واحدة مع إمكانية التحميل المتأخر للعلاقات لاحقاً"""
        stmt=select(TaskStep).where(TaskStep.id == step_id)
        if task_id:
            stmt=stmt.where(TaskStep.task_id == task_id)
        
        #set options
        stmt=TaskStepRepository.getBaseQueryOptions(stmt)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_steps_by_task(db: AsyncSession, task_id: int, parent_id: int = None, fetch_all_for_tree: bool = False):
        # جلب الخطوات مع ترتيب واضح لضمان القراءة الصحيحة شريطة شحن العلاقات العميقة
        stmt=select(TaskStep).where(
                TaskStep.task_id == task_id,
                TaskStep.deleted_at.is_(None)
            )
        if not fetch_all_for_tree:
            stmt = stmt.where(TaskStep.parent_id == parent_id)

        
        stmt=stmt.options(
            joinedload(TaskStep.completed_by_user),
            joinedload(TaskStep.assignee),
            joinedload(TaskStep.department).joinedload(Department.job_level),
            joinedload(TaskStep.dependencies)
            ).order_by(TaskStep.step_order.asc())

        result = await db.execute(stmt)
        return result.unique().scalars().all()

    @staticmethod
    async def get_max_order(db: AsyncSession, task_id: int, parent_id: int = None) -> int:
        from sqlalchemy import func
        stmt = (
            select(func.max(TaskStep.step_order))
            .where(
                TaskStep.task_id == task_id,
                TaskStep.parent_id == parent_id, # يفلتر الترتيب داخل نفس المستوى
                TaskStep.deleted_at.is_(None)     # يستثني المحذوفين soft deleted
            )
        )
        result = await db.execute(stmt)
        return result.scalar() or 0
    
    @staticmethod
    async def reindex_all(db: AsyncSession, task_id: int, parent_id: int = None):
        """إعادة ترقيم تسلسلي نظيف للخطوات النشطة فقط داخل نفس مستوى الأبوة من (1 لـ N)"""
        # جلب الإخوة النشطين فقط في هذا المستوى
        steps = await TaskStepRepository.get_steps_by_task(db, task_id, parent_id=parent_id)
        
        # إعادة الترقيم خطوة بخطوة في الذاكرة ليتم حفظها عند الـ commit في السيرفيس
        for index, step in enumerate(steps):
            step.step_order = index + 1

    @staticmethod
    async def getStepByparent_ids(db: AsyncSession, parent_ids: List):
        stmt_deps = select(TaskStep).where(TaskStep.id.in_(parent_ids))
        res_deps = await db.execute(stmt_deps)
        return res_deps.scalars().all()
   