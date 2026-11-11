# app/repositories/notification_repository.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from app.models import Notification
from app.schemas.notifications import NotificationOut
from typing import List, Optional
from app.core.utils import normalize_arabic
from datetime import datetime
class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_query(self, user_id: int):
        return select(Notification).where(Notification.user_id == user_id,Notification.deleted_at.is_(None)).order_by(Notification.created_at.desc())

    async def get_user_notifications_query(self, user_id: int, unread_only: bool):
        query = await self.get_query(user_id)
        if unread_only:
            query = query.where(Notification.read_at.is_(None))
        return query

    async def get_unread_count(self, user_id: int) -> int:
        query = select(func.count()).where(
            Notification.user_id == user_id,
            Notification.read_at.is_(None),
            Notification.deleted_at.is_(None)
        )
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def mark_all_as_read(self, user_id: int):
        await self.db.execute(
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.read_at.is_(None)
            )
            .values(read_at=datetime.utcnow())
        )
        await self.db.commit()

    async def clear_read(self, user_id: int):
        return await self.db.execute(delete(Notification).where(Notification.user_id == user_id, Notification.read_at.is_not(None)))
    
    async def find_by_id(self, notif_id: int, user_id: int) -> Optional[Notification]:
        result = await self.db.execute(
            select(Notification).where(
                Notification.id == notif_id,
                Notification.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    async def delete_all_read(self, user_id: int) -> int:
        result = await self.db.execute(
            delete(Notification).where(
                Notification.user_id == user_id,
                Notification.read_at.is_not(None)
            )
        )
        await self.db.commit()
        return result.rowcount

    async def update_read_status(self, notif: Notification):
        notif.read_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(notif)
    
    async def soft_delete(self, notif_id: int, user_id: int) -> bool:
        result = await self.db.execute(
            update(Notification)
            .where(Notification.id == notif_id, Notification.user_id == user_id)
            .values(deleted_at=datetime.utcnow())
        )
        await self.db.commit()
        return result.rowcount > 0