# app/repositories/user_contact_repository.py
from typing import List, Optional
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload,joinedload
from app.models.User import User 
from app.models.UserContact import UserContact
class UserContactRepository:
    @staticmethod
    async def get_by_user_id(db, user_id: int):
        result = await db.execute(select(UserContact).where(UserContact.user_id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def upsert(db, user_id: int, data: dict):
        contact = await UserContactRepository.get_by_user_id(db,user_id)
        if contact:
            for key, value in data.items():
                setattr(contact, key, value)
        else:
            contact = UserContact(**data, user_id=user_id)
            db.add(contact)
            
        await db.commit()
        await db.refresh(contact)
        return contact