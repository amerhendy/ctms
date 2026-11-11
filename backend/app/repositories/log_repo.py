#app/repositories/log_repo.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload, with_loader_criteria
from app.models.TaskLog import TaskLog
class LogRepository:
    @staticmethod
    async def get_task_logs_query(task_id: int):
        return (
            select(TaskLog)
            .options(selectinload(TaskLog.user))
            .where(TaskLog.task_id == task_id)
            .order_by(TaskLog.timestamp.asc())
        )