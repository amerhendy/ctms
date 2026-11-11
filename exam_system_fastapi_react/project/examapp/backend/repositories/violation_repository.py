from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.violation import Violation
from repositories.base_repository import BaseRepository
from fastapi import Depends
from db.session import get_db

class ViolationRepository:
    @staticmethod
    async def list_by_user(user_id: str, db: AsyncSession = Depends(get_db)):
        stmt = (
                select(Violation)
            .where(Violation.user_id == user_id)
            .order_by(Violation.occurred_at)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def delete_violation(violation:Violation,db: AsyncSession = Depends(get_db)):
        await db.delete(violation)
        await db.commit()

    @staticmethod
    async def create(payload,db:AsyncSession):
        violation = Violation(**payload)
        db.add(violation)
        await db.commit()
        await db.refresh(violation)
        return violation
    @staticmethod
    async def delete_by_user(user_id: str, db: AsyncSession = Depends(get_db)):
        stmt = select(Violation).where(Violation.user_id == user_id)
        result = await db.execute(stmt)
        violations = result.scalars().all()
        for violation in violations:
            await db.delete(violation)
        await db.commit()