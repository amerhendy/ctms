#app/repositories/taskShare_rep.py
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload, joinedload
from app.models import TaskShare, Task,User
class TaskShareRepository:
    @staticmethod
    async def CheckIfShare(db,task_id,shared_with_user_id):
        stm=select(TaskShare).where(
            TaskShare.task_id == task_id,
            TaskShare.shared_with_user_id == shared_with_user_id,
        )
        result=await db.execute(stm)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_shares_by_task_id(db, task_id):
        stmt = (
            select(TaskShare)
            .options(
                selectinload(TaskShare.shared_with)
                .selectinload(User.contacts)  # تحميل العلاقة المتداخلة هنا
            )
            .where(TaskShare.task_id == task_id)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_share_with_task(db, share_id):
        stmt = (
            select(TaskShare, Task)
            .join(Task, TaskShare.task_id == Task.id)
            .where(TaskShare.id == share_id)
        )
        result = await db.execute(stmt)
        return result.one_or_none() # يرجع tuple (TaskShare, Task)
    @staticmethod
    async def delete_share(db, share):
        await db.delete(share)