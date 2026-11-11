from sqlalchemy.ext.asyncio import AsyncSession

from models.session import Session as SessionModel
from datetime import datetime, timezone
from sqlalchemy import select

class SessionRepository:
    @staticmethod
    async def create(payload: dict, db: AsyncSession) -> SessionModel:
        session = SessionModel(**payload)
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session
    @staticmethod
    async def get_by_token(token: str, db: AsyncSession) -> SessionModel | None:
        stmt = select(SessionModel).where(SessionModel.token == token)
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def get_valid_by_token(token: str, db: AsyncSession) -> SessionModel | None:
        session = await SessionRepository.get_by_token(token, db)
        # يفضل استخدام timezone.utc للوقت الحالي بدلاً من utcnow الحالية
        if session and session.expires_at:
            # 🟢 تحويل تاريخ الجلسة إلى UTC offset-aware إذا كان naive
            expires_at = session.expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
                
            if expires_at > datetime.now(timezone.utc):
                return session
        return None

    @staticmethod
    async def delete_by_token(token: str, db: AsyncSession) -> bool:
        session = await SessionRepository.get_by_token(token, db)
        print(token)
        if not session:
            return False
        
        await db.delete(session)
        await db.commit()
        return True
    