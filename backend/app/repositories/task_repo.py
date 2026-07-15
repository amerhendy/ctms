#app/repositories/task_repo.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models import Task, TaskAssignment, TaskShare, TaskComment, Favorite,User
from sqlalchemy.orm import selectinload
from app.db.enums import GlobalRole
from app.models.Department import Department
from app.repositories.department_manager_repository import DepartmentManagerRepository
from app.core.permissions import AccessService
from app.repositories.user_repository import UserRepository
from app.core.utils import logger
from app.models.TaskStep import TaskStep

class TaskRepository:
    @staticmethod
    def get_base_query():
        return select(Task).options(
            #creator
            selectinload(Task.creator).selectinload(User.contacts),
            #department
            selectinload(Task.department).options(
                selectinload(Department.job_level),
                selectinload(Department.location)
            ),
            #favorites
            selectinload(Task.favorites),
            #steps
            selectinload(Task.steps).options(
                selectinload(TaskStep.assignee).selectinload(User.contacts),
                selectinload(TaskStep.department).selectinload(Department.job_level),
                selectinload(TaskStep.children)
                ),
            selectinload(Task.shares),
            selectinload(Task.comments),
            selectinload(Task.assignments).selectinload(TaskAssignment.user).joinedload(User.contacts),
        ).where(Task.deleted_at.is_(None))

    @staticmethod
    async def apply_user_access(query, user,db):
        if AccessService.is_pm_or_admin(user):
            return query
        
        deps=await DepartmentManagerRepository.get_subordinate_department_ids(db,user)
        subordinates_query = await UserRepository.get_subordinates_query(db, deps)
        result = await db.execute(subordinates_query)
        subordinates = result.scalars().all()
        subordinate_ids = [u.id for u in subordinates]
        authorized_user_ids = list(set([user.id] + subordinate_ids))

        query = query.where(or_(
            Task.created_by.in_(authorized_user_ids),
            Task.id.in_(
                select(TaskAssignment.task_id)
                    .where(TaskAssignment.user_id.in_(authorized_user_ids), TaskAssignment.deleted_at.is_(None))
            ),
            Task.department_id == user.department_id,
            Task.id.in_(
                select(TaskShare.task_id)
                .where(TaskShare.shared_with_user_id.in_(authorized_user_ids))
            ),
            Task.id.in_(select(TaskComment.task_id).where(TaskComment.user_id == user.id)),
        ))
        return query
    
    @staticmethod
    async def apply_filters(query, filters,current_user):
        if filters.get("status"):
            status_list = [s.strip() for s in filters["status"].split(',')]
            query = query.where(Task.status.in_(status_list))
        if filters.get("priority"):
            query = query.where(Task.priority == filters["priority"])
        if filters.get("is_urgent") is not None:
            query = query.where(Task.is_urgent == filters["is_urgent"])
        if filters.get("department_id"):
            query = query.where(Task.department_id == filters["department_id"])
        if filters.get("date_from"):
            query = query.where(Task.due_date >= filters["date_from"])
        if filters.get("date_to"):
            query = query.where(Task.due_date <= filters["date_to"])

        # التعامل مع الـ q (البحث المتقدم متعدد الأعمدة للمهام)
        if filters.get("q"):
            query = query.where(
                or_(
                    Task.title.ilike(f"%{filters['q']}%"),
                    Task.description.ilike(f"%{filters['q']}%"),
                    Task.file_number.ilike(f"%{filters['q']}%"),
                )
            )
        if filters.get("assigned_to_me"):
            query = query.where(Task.id.in_(select(TaskAssignment.task_id).where(TaskAssignment.user_id == current_user.id)))
        if filters.get("favorites_only"):
            query = query.where(Task.id.in_(select(Favorite.task_id).where(Favorite.user_id == current_user.id)))
        return query

    @staticmethod
    async def get_task_by_id(db, task_id, current_user):
        query = TaskRepository.get_base_query().where(Task.id == task_id)
        query = await TaskRepository.apply_user_access(query, current_user,db)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_task(db: AsyncSession, task: Task):
        db.add(task)
        await db.flush()  # للحصول على الـ ID فوراً
        return task