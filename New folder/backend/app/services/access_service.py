# app/services/access_service.py
"""
نقطة الحقيقة الوحيدة لكل صلاحيات النظام.
"""
from __future__ import annotations

from datetime import date
from typing import List, Optional, TYPE_CHECKING

from fastapi import Depends, HTTPException, status
from sqlalchemy import and_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.enums import GlobalRole, SharePermission
from app.models.Delegation import Delegation
from app.models.Task import Task
from app.models.TaskAssignment import TaskAssignment
from app.models.TaskShare import TaskShare
from app.models.User import User
from app.models.Department import Department
from app.models.DepartmentManager import DepartmentManager


# ══════════════════════════════════════════════════════════════════════════════
# 1. فحوصات الدور العام (stateless)
# ══════════════════════════════════════════════════════════════════════════════

class AccessService:

    @staticmethod
    def is_global_admin(user: User) -> bool:
        return user.global_role == GlobalRole.GLOBAL_ADMIN

    @staticmethod
    def is_program_manager(user: User) -> bool:
        return user.global_role == GlobalRole.PROGRAM_MANAGER

    @staticmethod
    def is_pm_or_admin(user: User) -> bool:
        return AccessService.is_global_admin(user) or AccessService.is_program_manager(user)

    @staticmethod
    def require_pm_or_admin(user: User) -> None:
        if not AccessService.is_pm_or_admin(user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="غير مصرح - يلزم صلاحية مدير النظام أو مدير البرنامج",
            )

    @staticmethod
    def admin_or_pm_dependency(
        current_user: User = Depends(get_current_user),
    ) -> User:
        AccessService.require_pm_or_admin(current_user)
        return current_user

    @staticmethod
    def can_update_user(current_user: User, target_user_id: int) -> bool:
        return AccessService.is_pm_or_admin(current_user) or current_user.id == target_user_id

    @staticmethod
    def verify_update_permission(current_user: User, target_user_id: int) -> None:
        if not AccessService.can_update_user(current_user, target_user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="غير مصرح - لا تملك صلاحية تعديل بيانات هذا المستخدم",
            )

    @staticmethod
    def can_manage_task(user: User, task: Task) -> bool:
        return AccessService.is_pm_or_admin(user) or task.created_by == user.id


# ══════════════════════════════════════════════════════════════════════════════
# 2. جلب نطاق الأقسام (Recursive CTE)
# ══════════════════════════════════════════════════════════════════════════════




async def get_task_scope_filter(db: AsyncSession, user: User):
    """
    يبني شرط SQLAlchemy للمهام التي يحق للمستخدم رؤيتها.

    القواعد:
    - GLOBAL_ADMIN / PROGRAM_MANAGER  → يشوف كل شيء (لا فلتر)
    - مدير قسم                        → يشوف مهام قسمه + كل الأقسام التابعة له
    - موظف عادي                       → يشوف مهامه هو فقط (أنشأها / معين عليها / مشاركة معه)

    الضمان: المدير يشوف مهام مرؤوسيه، لكن الموظف لا يشوف مهام مديره.
    """
    from sqlalchemy import or_

    # Admin و PM يشوفون كل شيء
    if AccessService.is_pm_or_admin(user):
        return None

    # الأقسام التي تحت إشراف المستخدم (فارغة لو مش مدير)
    subordinate_dept_ids = await get_subordinate_department_ids(db, user)

    conditions = [
        # المهام اللي أنشأها هو
        Task.created_by == user.id,

        # المهام المعينة عليه
        Task.id.in_(
            select(TaskAssignment.task_id).where(
                TaskAssignment.user_id == user.id,
                TaskAssignment.deleted_at.is_(None),
            )
        ),

        # المهام المشاركة معه
        Task.id.in_(
            select(TaskShare.task_id).where(
                TaskShare.shared_with_user_id == user.id,
            )
        ),

        # مهام قسمه هو
        Task.department_id == user.department_id,
    ]

    # لو مدير: يضيف مهام الأقسام التابعة له
    if subordinate_dept_ids:
        conditions.append(
            Task.department_id.in_(subordinate_dept_ids)
        )

    return or_(*conditions)


# ══════════════════════════════════════════════════════════════════════════════
# 3. صلاحيات المهام الفردية (تحتاج DB)
# ══════════════════════════════════════════════════════════════════════════════

async def _get_share(db: AsyncSession, task_id: int, user_id: int) -> Optional[TaskShare]:
    result = await db.execute(
        select(TaskShare).where(
            TaskShare.task_id == task_id,
            TaskShare.shared_with_user_id == user_id,
        )
    )
    share = result.scalar_one_or_none()
    if share and (share.expires_at is None or share.expires_at > date.today()):
        return share
    return None


async def get_task_share_permission(
    db: AsyncSession, user: User, task: Task
) -> Optional[SharePermission]:
    share = await _get_share(db, task.id, user.id)
    return share.permission if share else None


async def can_view_task(db: AsyncSession, user: User, task: Task) -> bool:
    if AccessService.is_pm_or_admin(user):
        return True
    if task.created_by == user.id:
        return True
    if task.department_id == user.department_id:
        return True

    result = await db.execute(
        select(TaskAssignment).where(
            TaskAssignment.task_id == task.id,
            TaskAssignment.user_id == user.id,
        )
    )
    if result.scalar_one_or_none():
        return True

    if await _get_share(db, task.id, user.id):
        return True

    # مدير يشوف مهام الأقسام التابعة له
    subordinate_dept_ids = await get_subordinate_department_ids(db, user)
    if task.department_id in subordinate_dept_ids:
        return True

    return False


async def can_edit_task(db: AsyncSession, user: User, task: Task) -> bool:
    if AccessService.is_pm_or_admin(user):
        return True
    if task.created_by == user.id:
        return True
    if task.department_id == user.department_id:
        return True

    perm = await get_task_share_permission(db, user, task)
    if perm in (SharePermission.EDIT, SharePermission.MANAGE, SharePermission.ADMIN):
        return True

    if await has_delegated_permission(db, user.id, task.department_id, "modify"):
        return True

    return False


async def can_manage_task_db(db: AsyncSession, user: User, task: Task) -> bool:
    if AccessService.is_pm_or_admin(user):
        return True
    if task.created_by == user.id:
        return True
    if task.department_id == user.department_id:
        return True

    perm = await get_task_share_permission(db, user, task)
    if perm in (SharePermission.MANAGE, SharePermission.ADMIN):
        return True

    return False


async def can_transfer_task(
    db: AsyncSession,
    sender: User,
    task: Task,
    target_user: User,
) -> tuple[bool, str]:
    if AccessService.is_global_admin(sender):
        return True, ""

    if task.department_id != sender.department_id and task.created_by != sender.id:
        return False, "ليس لديك صلاحية تحويل هذه المهمة"

    if sender.job_level_id is None or target_user.job_level_id is None:
        return False, "يجب تحديد المستوى الوظيفي للمرسل والمستقبل"

    if sender.job_level_id != target_user.job_level_id:
        return False, (
            f"لا يمكن التحويل: المستوى الوظيفي مختلف "
            f"(المرسل: {sender.job_level_id}، المستقبل: {target_user.job_level_id}). "
            f"يجب التحويل لنفس المستوى الإداري."
        )

    if target_user.department_id == task.department_id:
        return False, "المستقبل في نفس الإدارة - استخدم التعيين الداخلي"

    return True, ""


async def can_share_externally(
    db: AsyncSession, user: User, task: Task
) -> tuple[bool, bool]:
    if AccessService.is_global_admin(user):
        return True, False
    if task.created_by != user.id and task.department_id != user.department_id:
        return False, False
    if user.can_transfer_external:
        return True, False
    return True, True


# ══════════════════════════════════════════════════════════════════════════════
# 4. التفويضات
# ══════════════════════════════════════════════════════════════════════════════

async def has_delegated_permission(
    db: AsyncSession,
    user_id: int,
    department_id: int,
    permission: str,
) -> bool:
    today = date.today()
    result = await db.execute(
        select(Delegation).where(
            and_(
                Delegation.delegate_id == user_id,
                Delegation.is_active == True,
                Delegation.start_date <= today,
            )
        )
    )
    for d in result.scalars().all():
        if d.end_date and d.end_date < today:
            continue
        if permission in d.permissions:
            return True
    return False


# ══════════════════════════════════════════════════════════════════════════════
# 5. صلاحيات الأقسام والمستخدمين
# ══════════════════════════════════════════════════════════════════════════════

async def can_view_user(
    db: AsyncSession,
    current_user: User,
    target_user_id: int,
) -> bool:
    if current_user.id == target_user_id:
        return True
    if AccessService.is_pm_or_admin(current_user):
        return True

    # المدير يشوف بيانات موظفي أقسامه
    from app.repositories.user_repository import UserRepository
    target = await UserRepository.get_by_id_with_relations(db, target_user_id)
    if not target:
        return False

    subordinate_dept_ids = await get_subordinate_department_ids(db, current_user)
    return target.department_id in subordinate_dept_ids


async def can_view_department(
    db: AsyncSession, current_user: User, department_id: int
) -> bool:
    if AccessService.is_global_admin(current_user):
        return True
    subordinate_dept_ids = await get_subordinate_department_ids(db, current_user)
    return department_id in subordinate_dept_ids


async def is_manager_of(
    db: AsyncSession, user: User, department_id: int
) -> bool:
    if AccessService.is_pm_or_admin(user):
        return True
    subordinate_dept_ids = await get_subordinate_department_ids(db, user)
    return department_id in subordinate_dept_ids


# ══════════════════════════════════════════════════════════════════════════════
# 6. فلتر قائمة المهام (يُستخدم في task_repo)
# ══════════════════════════════════════════════════════════════════════════════

def get_user_accessible_tasks_filter(user: User):
    """
    نسخة بسيطة بدون DB — للاستخدام السريع فقط.
    استخدم get_task_scope_filter() لو محتاج منطق الشجرة الهرمية.
    """
    from sqlalchemy import or_
    if AccessService.is_global_admin(user):
        return None
    return or_(
        Task.department_id == user.department_id,
        Task.created_by == user.id,
    )
