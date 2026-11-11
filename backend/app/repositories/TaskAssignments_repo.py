#app/repositories/TaskAssignments_repo.py
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models import (User, TaskAssignment) 
from datetime import datetime
class TaskAssignmentRepository:
    @staticmethod
    async def create_task_assignment(db, assignment_data):
        new_assignment = TaskAssignment(**assignment_data.dict())
        db.add(new_assignment)
        await db.flush()  # للحصول على ID الخاص بالتعيين الجديد
        return new_assignment
    
    @staticmethod
    async def create_task_assignments(db, assignments: list):
        db.add_all(assignments) # أضفها كلها مرة واحدة
        await db.flush()  # للحصول على IDs الخاصة بالتعيينات الجديدة
        return assignments
    
    @staticmethod
    async def get_active_assignment(db, task_id, user_id):
        stmt = select(TaskAssignment).where(
            TaskAssignment.task_id == task_id,
            TaskAssignment.user_id == user_id,
            TaskAssignment.deleted_at.is_(None)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def un_assign(db,assignment):
        assignment.deleted_at = datetime.utcnow()
        await db.commit()
        return True
    

    @staticmethod
    async def get_deleted_assignment(db, task_id, user_id):
        stmt = select(TaskAssignment).where(
            TaskAssignment.task_id == task_id,
            TaskAssignment.user_id == user_id,
            TaskAssignment.deleted_at.is_not(None)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def restore_assign(db,assignment):
        assignment.deleted_at = None

    @staticmethod
    async def get_active_assignments_by_task(db, task_id):
        stmt = (
            select(TaskAssignment)
            .where(
                TaskAssignment.task_id == task_id,
                TaskAssignment.deleted_at.is_(None)
            )
            .options(
                selectinload(TaskAssignment.user),
                selectinload(TaskAssignment.assigner)
            )
        )
        result = await db.execute(stmt)
        return result.scalars().all()