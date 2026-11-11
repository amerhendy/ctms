from sqlalchemy import select, delete
from app.models import Favorite

class FavoriteRepository:
    @staticmethod
    async def get_favorite(db, task_id, user_id):
        result = await db.execute(
            select(Favorite).where(Favorite.task_id == task_id, Favorite.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def add_favorite(db, task_id, user_id):
        db.add(Favorite(task_id=task_id, user_id=user_id))

    @staticmethod
    async def remove_favorite(db, favorite):
        await db.delete(favorite)