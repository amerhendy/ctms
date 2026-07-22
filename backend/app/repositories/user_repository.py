# app/repositories/user_repository.py

from typing import List, Optional
from sqlalchemy import select, func,  or_,asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload,joinedload,defer
from sqlalchemy import Integer, Table, Column, select, text
from sqlalchemy.dialects.postgresql import array  # إذا كنت تستخدم PostgreSQL
from app.models.User import User  # تأكد من المسار الصحيح لنموذج User
from app.models.Task import Task
from app.models.TaskAssignment import TaskAssignment
from app.models.TaskTimeLog import TaskTimeLog
from app.models.TaskComment import TaskComment
from app.models.Favorite import Favorite
from app.db.enums import TaskStatus, AssignmentType
from app.models.Department import Department

class UserRepository:

    @staticmethod
    def get_Base():
        base_options = [
            selectinload(User.job_level),
            selectinload(User.work_location),
            selectinload(User.department).options(
                joinedload(Department.job_level),
                joinedload(Department.location),
            ),
            selectinload(User.notification_settings),
            selectinload(User.logs),
            selectinload(User.contacts),
            selectinload(User.managed_departments),
            defer(User.password_hash)
        ]
        query = select(User).options(*base_options)
        return query


    @staticmethod
    async def get_user_tasks(
            db, user_id: int, 
            include_completed: bool = False, 
            assignment_types: Optional[List[AssignmentType]] = None
        ) -> List[Task]:
        """
        جلب جميع المهام التي يكون فيها المستخدم هو ASSIGNEE.
        إذا كانت include_completed=False، يتم استبعاد المهام المكتملة أو الملغاة.
        """
        if assignment_types is None:
            assignment_types = [AssignmentType.ASSIGNEE, AssignmentType.COLLABORATOR, AssignmentType.VIEWER]
        stmt = (
            select(Task)
            .join(TaskAssignment, TaskAssignment.task_id == Task.id)
            .where(
                TaskAssignment.user_id == user_id,
                TaskAssignment.assignment_type.in_(assignment_types),
                Task.deleted_at.is_(None),
            )
        )
        if not include_completed:
            stmt = stmt.where(
                Task.status.notin_([TaskStatus.COMPLETED, TaskStatus.CANCELLED])
            )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_user_time_logs(db, user_id: int) -> List[TaskTimeLog]:
        """جلب جميع سجلات الوقت الخاصة بالمستخدم."""
        stmt = select(TaskTimeLog).where(TaskTimeLog.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_user_comments_count(db, user_id: int) -> int:
        """إرجاع عدد التعليقات التي كتبها المستخدم."""
        stmt = select(func.count()).select_from(TaskComment).where(TaskComment.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalar() or 0

    @staticmethod
    async def get_user_favorites_count(db, user_id: int) -> int:
        """إرجاع عدد المهام المفضلة للمستخدم."""
        stmt = select(func.count()).select_from(Favorite).where(Favorite.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalar() or 0
    
    @staticmethod
    async def get_by_id_with_relations(db, user_id: int): 
        """جلب مستخدم مع كافة علاقاته المطلوبة"""
        query = UserRepository.get_full_user_relationships(user_id)
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    def get_full_user_relationships(user_id: int | None = None):
        query=UserRepository.get_Base()
        if user_id is not None:
            query = query.where(User.id == user_id)
        return query


    @staticmethod
    async def get_me(db, user_id: int): 
        query = UserRepository.get_full_user_relationships(user_id=user_id )
        result = await db.execute(query)
        return result.unique().scalar_one_or_none()
    
    async def get_user_with_manager(db, user_id: int) -> Optional[User]:
        """جلب مستخدم مع بيانات مديره (إذا كان لديه مدير)"""
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_with_relations(db, user_id: int) -> Optional[User]:
        query = UserRepository.get_full_user_relationships(user_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def update(db, user_id: int, update_data: dict) -> User:
        # 1. جلب الكائن الحالي
        user = await UserRepository.get_by_id_with_relations(db,user_id)
        if not user:
            return None
            
        # 2. تحديث الحقول (تطبيق البيانات الجديدة)
        for key, value in update_data.items():
            setattr(user, key, value)
            
        await db.commit()
        #await db.refresh(user)
        return user
    

    async def get_stats_counts(db):
        """جلب الإحصائيات الخام من قاعدة البيانات"""
        # 1. إجمالي المستخدمين
        total_stmt = select(func.count(User.id))
        total_res = await db.execute(total_stmt)
        total = total_res.scalar() or 0
        
        # 2. المستخدمين النشطين
        active_stmt = select(func.count(User.id)).where(User.is_active == True)
        active_res = await db.execute(active_stmt)
        active = active_res.scalar() or 0
        
        # 3. توزيع الأقسام
        dept_query = (
            select(User.department_id, Department.name, func.count(User.id))
            .outerjoin(Department, User.department_id == Department.id)
            .group_by(User.department_id, Department.name)
        )
        dept_res = await db.execute(dept_query)
        
        return {
            "total": total,
            "active": active,
            "dept_distribution": dept_res.all()
        }
        

    @staticmethod
    async def check_field_exists(db, field_name: str, value: str) -> bool:
        """دالة عامة للتحقق من وجود قيمة في حقل معين"""
        # استخدام getattr للتعامل مع الحقل ديناميكياً
        model_field = getattr(User, field_name)
        stmt = select(User).where(model_field == value)
        result = await db.execute(stmt)
        return result.scalar_one_or_none() is not None
        


    @staticmethod
    def get_users_filtered_query(db, filters: dict):
        """بناء استعلام المستخدمين بناءً على الفلاتر"""
        # لاحظ أننا نستخدم selectinload هنا لتجنب مشاكل العلاقات
        query = UserRepository.get_full_user_relationships(user_id=None)

        # تطبيق الفلاتر ديناميكياً
        dept_ids = filters.get("department_id")
        if dept_ids:
        # إذا كانت قائمة (list) نستخدم in_، إذا كانت رقماً واحداً ستعمل أيضاً
            if isinstance(dept_ids, list):
                query = query.where(User.department_id.in_(dept_ids))
            else:
                query = query.where(User.department_id == dept_ids)
                
        if filters.get("is_active") is not None:
            query = query.where(User.is_active == filters["is_active"])
        if filters.get("q"):
            search = f"%{filters['q']}%"
            query = query.where(or_(
                User.full_name.ilike(search), 
                User.email.ilike(search), 
                User.employee_number.ilike(search)
            ))
            
        return query
    
    async def check_duplicate(self, email: str, employee_number: str):
        result = await self.db.execute(
            select(User).where(or_(User.email == email, User.employee_number == employee_number))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db, user_data: User) -> User:
        db.add(user_data)
        await db.flush() # نستخدم flush للحصول على الـ ID قبل الـ commit
       
        return await UserRepository.get_user_with_relations(db,user_data.id)
    
    @staticmethod
    async def check_conflicts_for_creation(db, email: str, employee_number: str, google_id: str = None) -> str:
        """تتحقق من وجود أي تضارب عند إنشاء مستخدم جديد"""
        query = select(User).where(
            or_(
                User.email == email,
                User.employee_number == employee_number,
                (User.google_id == google_id) if google_id else False
            )
        )
        result = await db.execute(query)
        existing = result.scalar_one_or_none()
        
        if existing:
            if existing.email == email: return "البريد الإلكتروني"
            if existing.employee_number == employee_number: return "رقم الموظف"
            if google_id and existing.google_id == google_id: return "معرف جوجل"
            
        return None


    async def check_conflicts(db, user_id: int, email: str = None, employee_number: str = None, google_id: str = None) -> str:
        """
        تتحقق من وجود تضارب في الحقول الفريدة مع مستخدمين آخرين
        تعيد اسم الحقل المتضارب أو None إذا كان كل شيء سليم
        """
        conditions = []
        if email: conditions.append(User.email == email)
        if employee_number: conditions.append(User.employee_number == employee_number)
        if google_id: conditions.append(User.google_id == google_id)
        
        if not conditions: return None

        # البحث عن مستخدم آخر (id لا يساوي الحالي) يمتلك أياً من القيم المذكورة
        query = select(User).where(
            User.id != user_id,
            or_(*conditions)
        )
        result = await db.execute(query)
        existing = result.scalar_one_or_none()
        
        if existing:
            if email and existing.email == email: return "البريد الإلكتروني"
            if employee_number and existing.employee_number == employee_number: return "رقم الموظف"
            if google_id and existing.google_id == google_id: return "معرف جوجل"
            
        return None
    @staticmethod
    async def update_password(db, user_id: int, new_password_hash: str):
        user = await UserRepository.get_by_id_with_relations(db,user_id) # دالة جلب بسيطة
        if user:
            user.password_hash = new_password_hash
            await db.commit()
            return True
        return False
    
    async def get_subordinates_query(db, deps:List):
        """إرجاع الاستعلام الأساسي للمرؤوسين"""
        return select(User).where(
            User.department_id.in_(deps),
            User.is_active == True
        )

    @staticmethod
    async def get_department_manager_id(db, department_id: int):
        # نستخدم first() بدل scalars().all() للأداء الأفضل (جلب سجل واحد فقط)
        stmt = (
            select(User.id)
            .where(
                User.department_id == department_id,
                User.is_active == True
            )
            .order_by(User.job_level_id)
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def check_if_user_exists(db,user_id):
        stmt = (
            select(User.id)
            .where(
                User.id == user_id,
                User.is_active == True
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_oldest_employee_in_dept(db, department_id: int):
        # نفترض أن جدول المستخدمين يحتوي على department_id وتاريخ تعيين
        query = (
            select(User.id)
            .where(User.department_id == department_id)
            .order_by(asc(User.created_at)) # أو استخدم User.hire_date إذا كان موجوداً
            .limit(1)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()