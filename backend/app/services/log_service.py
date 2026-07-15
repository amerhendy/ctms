"""
Task Log Service – Mandatory audit trail for every task change.
Logs CANNOT be deleted. Every action is recorded.
"""
from fastapi import HTTPException,BackgroundTasks
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models import TaskLog
from app.models.UserLogs import UserLog
from app.repositories.task_repo import TaskRepository
from app.repositories.log_repo import LogRepository
from app.core.permissions import require_view_permission
from app.schemas.base import PaginatedResponse, apply_pagination
from app.core.utils import logger
class LogService:
    @staticmethod
    async def get_task_logs(db, task_id, current_user, page, limit):
        # 1. التحقق من وجود المهمة وصلاحية العرض
        task = await TaskRepository.get_task_by_id(db, task_id, current_user)
        if not task:
            raise HTTPException(404, "المهمة غير موجودة")
        await require_view_permission(db, current_user, task)

        # 2. تنفيذ الترقيم (باستخدام الموديل الذي جهزناه)
        base_query = await LogRepository.get_task_logs_query(task_id)
        paginated = await apply_pagination(db, base_query, TaskLog, page, limit)

        # 3. تنسيق البيانات (Data Mapping)
        formatted_items = [{
            "id": l.id,
            "action_type": l.action_type,
            "old_value": l.old_value,
            "new_value": l.new_value,
            "timestamp": l.timestamp.isoformat(),
            "user_id": l.user_id,
            "user_name": l.user.full_name if l.user else "النظام",
            "avatar_url": l.user.avatar_url if l.user else None,
        } for l in paginated["items"]]

        return {
            **paginated,
            "has_more": page < paginated.get("pages", 1),
            "items": formatted_items
        }
    
    @staticmethod
    async def log_action(
        db: AsyncSession,
        task_id: Optional[int],
        user_id: Optional[int],
        action_type: str,
        old_value: Optional[Any] = None,
        new_value: Optional[Any] = None,
        extra_data: Optional[str] = None,
        recurring_task_id: Optional[int] = None,
    ) -> TaskLog:
        """
        Record an audit log entry for a task event.
        
        action_type values:
        - created, edited, deleted
        - status_changed, progress_updated
        - step_added, step_completed, step_updated
        - assigned, unassigned
        - transferred, transfer_accepted, transfer_rejected
        - share_granted, share_revoked
        - urgent_requested, urgent_approved, urgent_rejected
        - delegated, delegation_revoked
        - commented, file_attached
        - reminder_set, favorite_added, favorite_removed
        """
        log = TaskLog(
            task_id=task_id,
            user_id=user_id,
            action_type=action_type,
            old_value=str(old_value) if old_value is not None else None,
            new_value=str(new_value) if new_value is not None else None,
            extra_data=extra_data,
            recurring_task_id=recurring_task_id,  # تمرير الحقل هنا
        )
        db.add(log)
        await db.flush()
        return log
    
    @staticmethod
    async def userLog(
        db: AsyncSession,
        user_id: Optional[int],
        action: str,
        old_data: Optional[Any] = None,
        new_data: Optional[Any] = None,
    ):
        try:
            log=UserLog(
                user_id=user_id,
                action=action,
                old_data=old_data,
                new_data=new_data
                )
            db.add(log)
            await db.flush()
            return log
        except Exception as e:
            logger.debug(e)
