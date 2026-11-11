from sqlalchemy import select

from sqlalchemy.ext.asyncio import AsyncSession

from models.admin import Admin
from repositories.base_repository import BaseRepository


class AdminRepository:
    @staticmethod
    async def get_by_username(username: str, db: AsyncSession) -> Admin | None:
        stmt = select(Admin).where(Admin.username == username)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_id(id:str,db:AsyncSession) -> Admin | None:
        stmt = select(Admin).where(Admin.id == id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()