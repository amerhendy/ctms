#app/repositories/department_repository.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select, update, func,text
from sqlalchemy.orm import selectinload, joinedload
from app.models import User, Location, Department, DepartmentManager
from app.schemas.users import UserOut, UserSummary, DepartmentOut, JobLevelOut
from app.schemas.locations import LocationOut, LocationCreate, LocationUpdate
from app.schemas.base import apply_pagination
from fastapi import HTTPException
from typing import List
class DepartmentRepository:

    @staticmethod
    def get_base_query():
        """بناء الاستعلام الأساسي مع الـ Options"""
        return select(Department).options(
            selectinload(Department.job_level),
            selectinload(Department.location),
            selectinload(Department.children)
        )

    @staticmethod
    async def get_by_id(db: AsyncSession, dept_id: int, include_relations=True):
        # استخدام الـ base query إذا كان المستخدم يريد العلاقات، وإلا استعلام عادي
        if include_relations:
            query = DepartmentRepository.get_base_query().where(Department.id == dept_id)
        else:
            query = select(Department).where(Department.id == dept_id)
            
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_paginated_departments(db: AsyncSession, page, page_size, parent_id, is_active, q, sort_by, sort_order):
        query = DepartmentRepository.get_base_query()

        # تطبيق الفلاتر
        if parent_id is not None:
            query = query.where(Department.parent_department_id.is_(None) if parent_id == 0 else Department.parent_department_id == parent_id)
        
        if is_active is not None:
            query = query.where(Department.is_active == is_active)

        # استدعاء المحرك الموحد
        return await apply_pagination(
            db=db,
            base_query=query,
            model_class=Department,
            page=page,
            page_size=page_size,
            search_query=q.strip() if q else None,
            search_column="name",
            sort_by=sort_by,
            sort_order=sort_order
        )
    
    @staticmethod
    async def create(db: AsyncSession, department_data: dict):
        new_dept = Department(**department_data)
        db.add(new_dept)
        await db.flush() # لجلب الـ ID قبل الـ Commit
        return new_dept
    
    @staticmethod
    async def get_all_kv(db: AsyncSession):
        """جلب المعرف والاسم فقط من القاعدة"""
        stmt = select(Department.id, Department.name).where(
                    Department.is_active == True
                ).order_by(Department.name)
        result = await db.execute(stmt)
        # نرجع النتائج كـ list of dicts مباشرة من الريبوزيتوري
        return [{"id": row[0], "name": row[1]} for row in result.all()]

    @staticmethod
    async def get_all_active_with_relations(db: AsyncSession):
        query = DepartmentRepository.get_base_query().options(
            joinedload(Department.managers).joinedload(DepartmentManager.user) # جلب المدير وبيانات الموظف التابع له
        )
        stmt = query.where(Department.is_active == True)
        result = await db.execute(stmt)
        return result.unique().scalars().all()
    
    @staticmethod
    async def get_by_name(db: AsyncSession, name: str):
        query=DepartmentRepository.get_base_query()
        result = await db.execute(query.where(Department.name == name))
        return result.scalar_one_or_none()

    
    
    @staticmethod
    async def get_users_by_department(db: AsyncSession, dept_id: int, page: int, page_size: int):
        base_query = select(User).where(User.department_id == dept_id).options(
            selectinload(User.job_level),
            selectinload(User.work_location),
            selectinload(User.contacts),
            selectinload(User.department).options(
                joinedload(Department.job_level),
                joinedload(Department.location)
            )
        )
         
        # استخدام المحرك الموحد الذي تستخدمه في الأقسام
        return await apply_pagination(
            db=db,
            base_query=base_query,
            model_class=User,
            page=page,
            page_size=page_size
        )

    @staticmethod
    async def update(db: AsyncSession, dept: Department, data: dict):
        for k, v in data.items():
            setattr(dept, k, v)
        await db.commit()
        await db.refresh(dept)
        return dept

    @staticmethod
    async def count_active_users_in_dept(db: AsyncSession, dept_id: int) -> int:
        stmt = select(func.count(User.id)).where(
            User.department_id == dept_id, 
            User.is_active == True
        )
        result = await db.execute(stmt)
        return result.scalar() or 0

    @staticmethod
    async def get_sub_department_ids(db: AsyncSession, department_id: int) -> List[int]:
        """
        جلب كافة الـ IDs للإدارات التابعة (شجرة) لإدارة معينة باستخدام Recursive CTE.
        هذا هو المكان الصحيح للاستعلام (داخل الـ Repository).
        """
        raw_query = text("""
            WITH RECURSIVE sub_departments AS (
                SELECT id FROM departments WHERE id = :dept_id
                UNION ALL
                SELECT d.id FROM departments d
                INNER JOIN sub_departments sd ON d.parent_department_id = sd.id
            )
            SELECT id FROM sub_departments
        """)
        
        result = await db.execute(raw_query, {"dept_id": department_id})
        return [row[0] for row in result.fetchall()]

    @staticmethod
    async def get_all_user_ids_in_dept_tree(db: AsyncSession, department_id: int) -> List[int]:
        # 1. جلب كل الـ dept_ids (شامل الفرعية) باستخدام الدالة الموجودة لديك
        dept_ids = await DepartmentRepository.get_sub_department_ids(db, department_id)
        
        # 2. جلب كل الـ user_ids المرتبطين بهذه الإدارات في استعلام واحد
        stmt = select(User.id).where(User.department_id.in_(dept_ids), User.is_active == True)
        result = await db.execute(stmt)
        return result.scalars().all()