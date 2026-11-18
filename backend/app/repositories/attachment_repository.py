# app/repositories/attachment_repository.py
from sqlalchemy.orm import joinedload
from sqlalchemy import select
from app.models.TaskAttachment import TaskAttachment
from app.models.User import User


class AttachmentRepository:
    @staticmethod
    def base_query():
        return (
            select(TaskAttachment)
            .options(joinedload(TaskAttachment.user).selectinload(User.contacts))
            .order_by(TaskAttachment.created_at.asc())
        )

    @staticmethod
    async def get_by_task(db, task_id: int, skip: int = 0, limit: int = 50):
        query=AttachmentRepository.base_query()
        query=query.filter(TaskAttachment.task_id == task_id)
        if limit != 0:
            query=query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def create(db, task_id: int, user_id: int, text: str):
        comment = TaskAttachment(task_id=task_id, user_id=user_id, comment_text=text)
        db.add(comment)
        db.commit()
        db.refresh(comment)
        return comment
    
    @staticmethod
    async def get_attachment_by_task_attachment(db,task_id,attach_id):
        query=AttachmentRepository.base_query()
        query=query.where(TaskAttachment.id == attach_id, TaskAttachment.task_id == task_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()