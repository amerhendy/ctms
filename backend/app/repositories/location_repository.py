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
    @staticmethod
    def get_base_query():
        """بناء الاستعلام الأساسي مع الـ Options لتحميل العلاقات الهرمية والمرتبطة"""
        return select(Location).options(
            selectinload(Location.children),
            selectinload(Location.departments)
        )

    @staticmethod
    async def exists_by_normalized_name(db, name: str, exclude_id: Optional[int] = None):
        normalized_name = normalize_arabic(name)
        # استخدام func.lower و normalize_arabic إذا كانت قاعدة البيانات تدعم ذلك، 
        # ولكن الأسهل برمجياً هو البحث وفلترة النتائج
        stmt = select(Location).where(Location.is_active == True)
        if exclude_id:
            stmt = stmt.where(Location.id != exclude_id)
            
        result = await db.execute(stmt)
        locations = result.scalars().all()
        
        # التحقق برمجياً بعد جلب البيانات
        return any(normalize_arabic(loc.name) == normalized_name for loc in locations)

    @staticmethod
    async def get_by_id(db, location_id: int):
        result = await db.execute(
            select(Location).where(Location.id == location_id, Location.is_active == True)
            )
        return result.scalars().first()

    @staticmethod
    async def get_users_query(db, location_id: int):
        query=UserRepository.get_Base();
        query=query.where(User.work_location_id == location_id, User.is_active == True)
        return query
    
    @staticmethod
    async def list_active(db, active:Optional[bool]=None):
        query = select(Location)
        if active == True:
            query=query.where(Location.is_active == True)
        elif active == False:
            query=query.where(Location.is_active == False)
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def create(db, data: dict):
        loc = Location(**data)
        db.add(loc)
        await db.commit()
        await db.refresh(loc)
        return loc
    
    @staticmethod
    async def update(db, location_id: int, update_data: dict):
        result = await db.execute(select(Location).where(Location.id == location_id))
        loc = result.scalars().first()
        if not loc:
            return None
        
        for key, value in update_data.items():
            setattr(loc, key, value)
            
        await db.commit()
        await db.refresh(loc)
        return loc
    
    @staticmethod
    async def get_departments_by_location(db, location_id: int):
        query = (
            select(Department)
            .where(Department.location_id == location_id, Department.is_active == True)
            .options(
                selectinload(Department.job_level),
                selectinload(Department.location) # أضف هذا السطر
            )
        )
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def soft_delete(db, location_id: int):
        loc = await LocationRepository.get_by_id(db,location_id)
        if loc:
            loc.is_active = False
            await db.commit()
            await db.refresh(loc)
        return loc
    
    @staticmethod
    async def get_location_tree(db, is_active: Optional[bool] = None):
        """جلب الشجرة التنظيمية للمواقع تبدأ من الجذور (parent_id IS NULL) مع دعم فلترة الحالة"""
        query = (
            select(Location)
            .where(Location.parent_id == None)
            .options(selectinload(Location.children))
        )
        if is_active is not None:
            query = query.where(Location.is_active == is_active)
            
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def is_descendant(db, location_id: int, potential_parent_id: int) -> bool:
        """التحقق مما إذا كان الموقع الأب المقترح يقع ضمن أبناء الموقع الحالي لمنع الدورات الهرمية"""
        if location_id == potential_parent_id:
            return True
            
        result = await db.execute(select(Location).where(Location.parent_id == location_id))
        children = result.scalars().all()
        
        for child in children:
            if child.id == potential_parent_id or await LocationRepository.is_descendant(db, child.id, potential_parent_id):
                return True
        return False
    
    @staticmethod
    async def get_all_active_with_relations(db: AsyncSession, is_active: Optional[bool] = None):
        """
        جلب كافة المواقع دفعة واحدة كقائمة مسطحة (Flat List) 
        مع دعم فلترة الحالة الاختيارية، لتجنب مشاكل الـ AsyncIO والمستويات المتداخلة.
        """
        query = LocationRepository.get_base_query()
        
        if is_active is not None:
            query = query.where(Location.is_active == is_active)
            
        result = await db.execute(query)
        return result.unique().scalars().all()