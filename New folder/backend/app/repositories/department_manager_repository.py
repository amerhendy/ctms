from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update,text
from sqlalchemy.orm import joinedload
from datetime import datetime
from typing import Optional, List
from app.models import DepartmentManager, User

class DepartmentManagerRepository:
    @staticmethod
    @staticmethod
    def _base_query():
        # نستخدم JOIN لجلب بيانات الموظف (User) مع سجل المدير دائماً
        return select(DepartmentManager).join(User).where(DepartmentManager.deleted_at == None)
    
    @staticmethod
    async def get_by_dept_and_user(db: AsyncSession, department_id: int, user_id: int) -> Optional[DepartmentManager]:
        # نستخدم الـ base_query لإضافة الشروط الخاصة فقط
        query = DepartmentManagerRepository._base_query().where(
            DepartmentManager.department_id == department_id,
            DepartmentManager.user_id == user_id
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_by_user(db: AsyncSession, user_id: int) -> List[DepartmentManager]:
        query = DepartmentManagerRepository._base_query().where(DepartmentManager.user_id == user_id)
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_by_dept(db: AsyncSession, department_id: int) -> List[DepartmentManager]:
        """دالة إضافية مفيدة جداً لعرض قائمة المديرين في المودال"""
        query = select(DepartmentManager).options(joinedload(DepartmentManager.user)).where(
            DepartmentManager.department_id == department_id,
            DepartmentManager.deleted_at == None
        )
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, department_id: int, user_id: int, is_primary: bool = True) -> DepartmentManager:
        new_manager = DepartmentManager(department_id=department_id, user_id=user_id, is_primary=is_primary)
        db.add(new_manager)
        await db.commit()
        await db.refresh(new_manager)
        return new_manager

    @staticmethod
    async def soft_delete(db: AsyncSession, department_id: int, user_id: int) -> bool:
        # هنا استخدمنا الـ get_by_dept_and_user المحدثة لتقليل الكود
        manager = await DepartmentManagerRepository.get_by_dept_and_user(db, department_id, user_id)
        if manager:
            manager.deleted_at = datetime.utcnow()
            await db.commit()
            return True
        return False
    
    @staticmethod
    async def get_primary_manager(db: AsyncSession, department_id: int) -> Optional[DepartmentManager]:
        """
        جلب المدير الرئيسي (Primary) الوحيد للإدارة.
        يستخدم عند الرغبة في استبدال المدير أو التحقق من وجود رئيسي.
        """
        query = DepartmentManagerRepository._base_query().where(
        DepartmentManager.department_id == department_id,
        DepartmentManager.is_primary == True,
        DepartmentManager.deleted_at == None
    ).options(joinedload(DepartmentManager.user))
        result = await db.execute(query)
        return result.scalar_one_or_none()


    @staticmethod
    async def get_subordinate_department_ids(
        db: AsyncSession,
        user: User,
    ) -> List[int]:
        """
        يجلب IDs كل الأقسام التي يملك المستخدم صلاحية الإشراف عليها.

        المنطق:
        ١. يجيب الأقسام التي يديرها المستخدم مباشرة (من department_managers)
        ٢. يوسع بـ Recursive CTE ليشمل كل الأقسام الأبناء تحتها

        ملاحظة: قسم المستخدم نفسه (department_id) مش بيُضاف هنا —
        الموظف يشوف مهام قسمه عبر شرط منفصل.
        """
        # ١. الأقسام التي يديرها المستخدم مباشرة
        result = await db.execute(
            select(DepartmentManager.department_id).where(
                DepartmentManager.user_id == user.id,
                DepartmentManager.deleted_at.is_(None),
            )
        )
        managed_ids = [row[0] for row in result.fetchall()]

        if not managed_ids:
            return []

        # ٢. Recursive CTE لجلب كل الأقسام الأبناء
        # نبني IN clause ديناميكي بأمان
        ids_literal = ",".join(str(i) for i in managed_ids)

        cte_query = text(f"""
            WITH RECURSIVE dept_tree AS (
                -- الأقسام التي يديرها المستخدم (نقطة البداية)
                SELECT id
                FROM departments
                WHERE id IN ({ids_literal})
                AND is_active = TRUE

                UNION ALL

                -- الأقسام الأبناء بشكل تكراري
                SELECT d.id
                FROM departments d
                INNER JOIN dept_tree dt ON d.parent_department_id = dt.id
                WHERE d.is_active = TRUE
            )
            SELECT id FROM dept_tree
        """)

        result = await db.execute(cte_query)
        return [row[0] for row in result.fetchall()]