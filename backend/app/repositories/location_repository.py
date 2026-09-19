# app/repositories/location_repository.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select, update, func
from sqlalchemy.orm import selectinload, joinedload
from app.models import User, Location, Department, JobLevel
from app.schemas.users import UserOut, UserSummary, DepartmentOut, JobLevelOut
from app.schemas.locations import LocationOut, LocationCreate, LocationUpdate
from typing import List, Optional
from app.core.utils import normalize_arabic
from app.repositories.user_repository import UserRepository

class LocationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def exists_by_normalized_name(self, name: str, exclude_id: Optional[int] = None):
        normalized_name = normalize_arabic(name)
        # استخدام func.lower و normalize_arabic إذا كانت قاعدة البيانات تدعم ذلك، 
        # ولكن الأسهل برمجياً هو البحث وفلترة النتائج
        stmt = select(Location).where(Location.is_active == True)
        if exclude_id:
            stmt = stmt.where(Location.id != exclude_id)
            
        result = await self.db.execute(stmt)
        locations = result.scalars().all()
        
        # التحقق برمجياً بعد جلب البيانات
        return any(normalize_arabic(loc.name) == normalized_name for loc in locations)

    async def get_by_id(self, location_id: int):
        result = await self.db.execute(
            select(Location).where(Location.id == location_id, Location.is_active == True)
            )
        return result.scalars().first()

    async def get_users_query(self, location_id: int):
        query=UserRepository.get_Base();
        query=query.where(User.work_location_id == location_id, User.is_active == True)
        return query
    
    async def list_active(self, active:Optional[bool]=None,department_id: Optional[int] = None):
        query = select(Location)
        if active == True:
            query=query.where(Location.is_active == True)
        elif active == False:
            query=query.where(Location.is_active == False)
        if department_id:
            query = query.where(Location.department_id == department_id)
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def create(self, data: dict):
        loc = Location(**data)
        self.db.add(loc)
        await self.db.commit()
        await self.db.refresh(loc)
        return loc
    
    async def update(self, location_id: int, update_data: dict):
        result = await self.db.execute(select(Location).where(Location.id == location_id))
        loc = result.scalars().first()
        if not loc:
            return None
        
        for key, value in update_data.items():
            setattr(loc, key, value)
            
        await self.db.commit()
        await self.db.refresh(loc)
        return loc
    
    async def get_departments_by_location(self, location_id: int):
        query = (
            select(Department)
            .where(Department.location_id == location_id, Department.is_active == True)
            .options(
                selectinload(Department.job_level),
                selectinload(Department.location) # أضف هذا السطر
            )
        )
        result = await self.db.execute(query)
        return result.scalars().all()