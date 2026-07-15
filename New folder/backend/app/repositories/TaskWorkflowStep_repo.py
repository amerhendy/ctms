from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.models.TaskWorkflowStepModel import TaskWorkflowStep
from app.models.TaskStepDependency_Model import TaskStepDependency

class TaskWorkflowStepRepository:

    @staticmethod
    async def create(db: AsyncSession, step_payload: dict) -> TaskWorkflowStep:
        """
        تقوم بإنشاء خطوة جديدة في قاعدة البيانات.
        تستخدم flush لجلب الـ id الخاص بالخطوة قبل إنهاء الـ Transaction.
        """
        # 1. إنشاء كائن الموديل من البيانات المرسلة
        new_step = TaskWorkflowStep(**step_payload)
        
        # 2. إضافة الكائن للـ Session
        db.add(new_step)
        
        # 3. عمل flush لجلب الـ ID وللتأكد من سلامة البيانات في قاعدة البيانات
        # بدون إنهاء الـ Transaction (يترك الـ commit لمستوى الـ Service)
        await db.flush()
        
        # 4. تحديث الكائن بالقيم التي قد تولدها قاعدة البيانات (مثل id)
        await db.refresh(new_step)
        
        return new_step
    

    @staticmethod
    def base_query():
        return select(TaskWorkflowStep).where(TaskWorkflowStep.deleted_at.is_(None)).options(
            selectinload(TaskWorkflowStep.dependencies),
            selectinload(TaskWorkflowStep.assigned_user),
            selectinload(TaskWorkflowStep.assigned_department)
        )

    @staticmethod
    async def get_step_by_id(db: AsyncSession, step_id: int):
        stmt = TaskWorkflowStepRepository.base_query().where(TaskWorkflowStep.id == step_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_parent_dependencies(db: AsyncSession, step_id: int):
        """جلب كل الـ Parent IDs لخطوة معينة للتحقق من الحالة"""
        stmt = select(TaskStepDependency.parent_step_id).where(
            TaskStepDependency.child_step_id == step_id
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def update_step_status(db: AsyncSession, step: TaskWorkflowStep, new_status: str, new_version: int):
        """تحديث الحالة مع الـ Optimistic Locking"""
        step.status = new_status
        step.version = new_version
        await db.flush()
        return step
    
    @staticmethod
    async def get_pending_steps(db: AsyncSession, workflow_id: int):
        """جلب الخطوات التي لم تكتمل في الـ Workflow."""
        stmt = select(TaskWorkflowStep).where(
            and_(
                TaskWorkflowStep.workflow_id == workflow_id,
                TaskWorkflowStep.status != "completed",
                TaskWorkflowStep.deleted_at.is_(None)
            )
        )
        result = await db.execute(stmt)
        return result.scalars().all()