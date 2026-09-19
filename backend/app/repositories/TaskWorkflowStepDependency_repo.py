from sqlalchemy.ext.asyncio import AsyncSession
from app.models.TaskWorkflowStepDependency_Model import TaskWorkflowStepDependency
from sqlalchemy import select

class TaskWorkflowStepDependencyRepository:
    @staticmethod
    async def get_parents(db: AsyncSession, child_step_id: int):
        stmt = select(TaskWorkflowStepDependency).where(TaskWorkflowStepDependency.child_step_id == child_step_id)
        result = await db.execute(stmt)
        return result.scalars().all()
    
    @staticmethod
    async def create_dependency(db: AsyncSession, child_step_id: int, parent_step_id: int):
        """
        تقوم بإنشاء اعتمادية (Dependency) بين خطوتين في الـ Workflow.
        """
        # 1. إنشاء كائن الاعتمادية
        new_dependency = TaskWorkflowStepDependency(
            child_step_id=child_step_id,
            parent_step_id=parent_step_id
        )
        
        # 2. إضافة الكائن للـ Session
        db.add(new_dependency)
        
        # 3. عمل flush لضمان تنفيذ الإضافة في قاعدة البيانات قبل انتهاء العملية
        await db.flush()
        
        return new_dependency
    
    @staticmethod
    async def get_all_ancestors(db: AsyncSession, step_id: int) -> set:
        """
        ترجع مجموعة (set) بكل الـ IDs التي تعتمد عليها هذه الخطوة (بشكل مباشر أو غير مباشر).
        """
        ancestors = set()
        stack = [step_id]
        
        while stack:
            current = stack.pop()
            # جلب الـ parents المباشرين للخطوة الحالية
            stmt = select(TaskWorkflowStepDependency.parent_step_id).where(
                TaskWorkflowStepDependency.child_step_id == current
            )
            result = await db.execute(stmt)
            parents = result.scalars().all()
            
            for p in parents:
                if p not in ancestors:
                    ancestors.add(p)
                    stack.append(p)
                    
        return ancestors
    
    @staticmethod
    async def get_parent_step_ids(db: AsyncSession, child_step_id: int) -> list[int]:
        stmt = select(TaskWorkflowStepDependency.parent_step_id).where(
            TaskWorkflowStepDependency.child_step_id == child_step_id
        )
        result = await db.execute(stmt)
        return result.scalars().all()