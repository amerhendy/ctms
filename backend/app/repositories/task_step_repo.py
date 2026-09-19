from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy import select, update, func, delete
from app.models.TaskStep import TaskStep
from typing import List, Dict, Any
from app.schemas.task_steps import StepReorderItem
class TaskStepRepository:
    @staticmethod
    def get_base_query_for_task(task_id: int):
        """إرجاع استعلام أساسي مع جاهزية للعلاقات (Relationships)"""
        return (
            select(TaskStep)
            .where(TaskStep.task_id == task_id)
            .order_by(TaskStep.step_order.asc(), TaskStep.id.asc())
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
        await db.execute(delete(TaskStep).where(TaskStep.id == step_id))
        await db.flush()

    @staticmethod
    async def bulk_update_order(db: AsyncSession, steps: List[StepReorderItem]):
        """تحديث جماعي للترتيب"""
        for item in steps:
            await db.execute(
                update(TaskStep)
                .where(TaskStep.id == item.id)
                .values(step_order=item.step_order)
            )
        await db.flush()

    @staticmethod
    async def get_by_id(db: AsyncSession, step_id: int) -> TaskStep:
        """جلب خطوة واحدة مع إمكانية التحميل المتأخر للعلاقات لاحقاً"""
        result = await db.execute(select(TaskStep).where(TaskStep.id == step_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_steps_by_task(db: AsyncSession, task_id: int):
        # جلب الخطوات مع ترتيب واضح لضمان القراءة الصحيحة
        result = await db.execute(
            select(TaskStep)
            .options(joinedload(TaskStep.completed_by_user))
            .options(joinedload(TaskStep.assignee))
            .options(joinedload(TaskStep.department))
            .where(TaskStep.task_id == task_id)
            .order_by(TaskStep.step_order.asc())
        )
        return result.scalars().all()

    @staticmethod
    async def get_max_order(db: AsyncSession, task_id: int) -> int:
        # استعلام للحصول على أعلى ترتيب حالي
        result = await db.execute(
            select(func.max(TaskStep.step_order))
            .where(TaskStep.task_id == task_id)
        )
        return result.scalar() or 0
    
    @staticmethod
    async def reindex_all(db: AsyncSession, task_id: int):
        """
        إعادة ترقيم الخطوات بشكل متسلسل.
        نسترجع كافة الخطوات ونعيد ضبط الـ step_order ليكون متوافقاً مع الترتيب الحالي.
        """
        # 1. جلب الخطوات مرتبة حسب الترتيب الحالي (لضمان أننا نعيد ترقيمها بنفس التسلسل)
        # نستخدم for update لضمان عدم حدوث تعديلات متزامنة (Locking)
        query = (
            select(TaskStep)
            .where(TaskStep.task_id == task_id)
            .order_by(TaskStep.step_order.asc(), TaskStep.id.asc())
            .with_for_update() 
        )
        result = await db.execute(query)
        steps = result.scalars().all()

        # 2. الترقيم المتسلسل
        for index, step in enumerate(steps, start=1):
            if step.step_order != index:
                step.step_order = index
        
        # 3. حفظ التغييرات
        await db.flush()


   