# app/repositories/auth_repository.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, or_
from sqlalchemy.orm import joinedload, load_only
from app.models import User
from app.models.DepartmentManager import DepartmentManager
from datetime import datetime

class AuthRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    def setOptions(self,stmt):
        return stmt.options(
                joinedload(User.managed_departments) # جلب بيانات الإدارة التي يديرها
            )


    async def get_by_identifier(self, identifier: str):
        stmt=select(User)
        stmt=self.setOptions(stmt)
        stmt=stmt.where(
                (User.email == identifier) | 
                (func.trim(User.employee_number) == identifier.strip())
            )
        result = await self.db.execute(stmt)
        return result.unique().scalar_one_or_none()

    async def get_by_google_id(self, google_id: str):
        stmt=select(User)
        stmt=self.setOptions(stmt)
        stmt=stmt.where(User.google_id == google_id)

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_id(self, user_id: int):
        stmt=select(User)
        stmt=self.setOptions(stmt)
        stmt=stmt.where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str):
        stmt=select(User)
        stmt=self.setOptions(stmt)
        stmt=stmt.where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_last_login(self, user_id: int):
        await self.db.execute(update(User).where(User.id == user_id).values(last_login=datetime.utcnow()))
        #await self.db.commit()

    async def update_user_google_data(self, user: User, google_id: str, email: str, avatar: str):
        user.google_id = google_id
        user.email = email
        user.last_login = datetime.now(timezone.utc).replace(tzinfo=None)
        if avatar and not user.avatar_url:
            user.avatar_url = avatar
        #await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def update_user(self, user: User):
        #await self.db.commit()
        await self.db.refresh(user)
        return user

    async def soft_delete(self, location_id: int):
        loc = await self.get_by_id(location_id)
        if loc:
            loc.is_active = False
            #await self.db.commit()
            await self.db.refresh(loc)
        return loc
    