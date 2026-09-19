# app/repositories/comment_repository.py
from sqlalchemy.orm import joinedload
from sqlalchemy import select
from app.models.TaskComment import TaskComment
from app.models.User import User


class CommentRepository:
    @staticmethod
    def base_query():
        return (
            select(TaskComment)
            .options(joinedload(TaskComment.user).selectinload(User.contacts))
            .order_by(TaskComment.created_at.asc())
        )

    @staticmethod
    async def get_by_task(db, task_id: int, skip: int = 0, limit: int = 50):
        query=CommentRepository.base_query()
        query=query.filter(TaskComment.task_id == task_id)
        if limit != 0:
            query=query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def create(db, task_id: int, user_id: int, text: str):
        comment = TaskComment(task_id=task_id, user_id=user_id, comment_text=text)
        db.add(comment)
        db.commit()
        db.refresh(comment)
        return comment
    
    @staticmethod
    async def get_comment_by_task_comment(db,task_id,comment_id):
        query=CommentRepository.base_query()
        query=query.where(TaskComment.id == comment_id, TaskComment.task_id == task_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()