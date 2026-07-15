# app/core/permissions.py
"""
صلاحيات المهام التفصيلية (Task-level permissions).
يعتمد على AccessService من app.services.access_service
"""
from typing import NamedTuple, List, Optional

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.utils import logger
from app.db.enums import GlobalRole
from app.models.RecurringTask import RecurringTask
from app.models.Task import Task
from app.models.User import User
from app.services.access_service import AccessService  # ← المرجع الوحيد


# ══════════════════════════════════════════════════════════════════════════════
# 1. هيكل الصلاحيات
# ══════════════════════════════════════════════════════════════════════════════

class TaskPermissions(NamedTuple):
    # العرض
    can_view: bool

    # المهمة
    can_edit_task: bool
    can_delete_task: bool
    can_transfer_task: bool
    can_change_status: bool

    # تعديل بيانات المهمة
    can_edit_basic: bool
    can_edit_dates: bool
    can_edit_priority: bool

    # المشاركة
    can_share_add: bool
    can_share_remove: bool

    # الاستعجال
    can_request_urgency: bool
    can_respond_urgency: bool

    # التحويل
    can_convert_task: bool

    # الخطوات
    can_add_step: bool
    can_delete_step: bool
    can_edit_step: bool

    # المنفذون
    can_assign_executor: bool
    can_unassign_executor: bool
    can_edit_executor: bool

    # التعليقات
    can_add_comment: bool
    can_edit_any_comment: bool
    can_edit_own_comment: bool
    can_delete_any_comment: bool
    can_delete_own_comment: bool

    # المرفقات
    can_add_attachment: bool
    can_view_attachment: bool
    can_delete_any_attachment: bool
    can_delete_own_attachment: bool

    # ── دوال مساعدة ──────────────────────────────────────────────────────────

    def can_edit_comment(self, comment_user_id: int, current_user_id: int) -> bool:
        if self.can_edit_any_comment:
            return True
        return self.can_edit_own_comment and comment_user_id == current_user_id

    def can_delete_comment(self, comment_user_id: int, current_user_id: int) -> bool:
        if self.can_delete_any_comment:
            return True
        return self.can_delete_own_comment and comment_user_id == current_user_id

    def can_delete_attachment(self, attachment_user_id: int, current_user_id: int) -> bool:
        if self.can_delete_any_attachment:
            return True
        return self.can_delete_own_attachment and attachment_user_id == current_user_id


# ══════════════════════════════════════════════════════════════════════════════
# 2. دوال مساعدة لفحص العلاقات المحملة في كائن Task
# ══════════════════════════════════════════════════════════════════════════════

def _has_relation(task: Task, user_id: int, relation_name: str, id_field: str = "user_id") -> bool:
    if not hasattr(task, relation_name):
        return False
    return any(getattr(item, id_field) == user_id for item in getattr(task, relation_name))


def _is_assignee(task: Task, user_id: int) -> bool:
    return _has_relation(task, user_id, "assignments", "user_id")


def _is_shared_with(task: Task, user_id: int) -> bool:
    return _has_relation(task, user_id, "shares", "shared_with_user_id")


def _is_commenter(task: Task, user_id: int) -> bool:
    return _has_relation(task, user_id, "comments", "user_id")

def _is_steper(task: Task, user_id: int) -> bool:
    return _has_relation(task, user_id, "steps", "assigned_user_id")

def _is_department_manager(user: User, task: Task) -> bool:
    """
    يتحقق من كون المستخدم مديراً للقسم المرتبط بالمهمة.
    يعتمد على حقل is_department_manager أو managed_departments.
    """
    if not task.department_id or task.department_id != user.department_id:
        return False
    if getattr(user, "is_department_manager", False):
        return True
    if task.department_id in getattr(user, "managed_department_ids", []):
        return True
    return False


# ══════════════════════════════════════════════════════════════════════════════
# 3. الدالة الرئيسية لحساب الصلاحيات
# ══════════════════════════════════════════════════════════════════════════════

_ALL_TRUE = dict(
    can_view=True, can_edit_task=True, can_delete_task=True,
    can_transfer_task=True, can_change_status=True,
    can_edit_basic=True, can_edit_dates=True, can_edit_priority=True,
    can_share_add=True, can_share_remove=True,
    can_request_urgency=True, can_respond_urgency=True, can_convert_task=True,
    can_add_step=True, can_delete_step=True, can_edit_step=True,
    can_assign_executor=True, can_unassign_executor=True, can_edit_executor=True,
    can_add_comment=True, can_edit_any_comment=True, can_edit_own_comment=True,
    can_delete_any_comment=True, can_delete_own_comment=True,
    can_add_attachment=True, can_view_attachment=True,
    can_delete_any_attachment=True, can_delete_own_attachment=True,
)


async def get_task_permissions(
    db: AsyncSession,
    user: User,
    task: Task,
) -> TaskPermissions:
    """
    يحسب كل صلاحيات المستخدم على مهمة معينة.

    يتوقع أن يكون كائن task محملاً بالعلاقات:
        assignments, shares, comments, attachments, creator, department
    """
    # تأكد من تحميل job_level
    if "job_level" not in user.__dict__:
        await db.refresh(user, ["job_level"])

    # Admin يملك كل شيء
    if AccessService.is_global_admin(user):
        return TaskPermissions(**_ALL_TRUE)

    # ── تحديد الأدوار ────────────────────────────────────────────────────────
    is_creator      = task.created_by == user.id
    is_assignee     = _is_assignee(task, user.id)
    is_shared       = _is_shared_with(task, user.id)
    is_commenter    = _is_commenter(task, user.id)
    is_dept_manager = _is_department_manager(user, task)
    is_steper       = _is_steper(task=task,user_id=user.id)
    is_prog_manager = AccessService.is_program_manager(user)

    has_any_relation = any([
        is_creator, is_assignee, is_shared,
        is_commenter, is_dept_manager, is_prog_manager,is_steper
    ])
    logger.debug(has_any_relation)
    logger.debug(is_steper)
    # ── حساب الصلاحيات ───────────────────────────────────────────────────────
    privileged = is_prog_manager or is_creator or is_dept_manager

    return TaskPermissions(
        # العرض
        can_view=has_any_relation,

        # المهمة
        can_edit_task=privileged,
        can_delete_task=is_prog_manager,
        can_transfer_task=privileged,
        can_change_status=privileged,

        # تعديل بيانات المهمة
        can_edit_basic=privileged,
        can_edit_dates=privileged,
        can_edit_priority=privileged,

        # المشاركة
        can_share_add=privileged or is_creator,
        can_share_remove=is_prog_manager or is_dept_manager,

        # الاستعجال
        can_request_urgency=is_creator or is_dept_manager or is_prog_manager,
        can_respond_urgency=privileged or is_assignee or is_shared,

        # التحويل
        can_convert_task=privileged,

        # الخطوات
        can_add_step=privileged or is_assignee,
        can_delete_step=privileged,
        can_edit_step=privileged,

        # المنفذون
        can_assign_executor=privileged,
        can_unassign_executor=privileged,
        can_edit_executor=privileged,

        # التعليقات
        can_add_comment=has_any_relation,
        can_edit_any_comment=is_prog_manager,
        can_edit_own_comment=True,
        can_delete_any_comment=is_prog_manager,
        can_delete_own_comment=True,

        # المرفقات
        can_add_attachment=has_any_relation,
        can_view_attachment=has_any_relation,
        can_delete_any_attachment=is_prog_manager,
        can_delete_own_attachment=True,
    )


# ══════════════════════════════════════════════════════════════════════════════
# 4. دوال Guard جاهزة للاستخدام في الـ Endpoints
# ══════════════════════════════════════════════════════════════════════════════

async def require_view_permission(
    db: AsyncSession, user: User, task: Task
) -> TaskPermissions:
    perms = await get_task_permissions(db, user, task)
    if not perms.can_view:
        raise HTTPException(403, "لا تملك صلاحية عرض هذه المهمة")
    return perms


async def require_edit_task_permission(
    db: AsyncSession, user: User, task: Task
) -> TaskPermissions:
    perms = await get_task_permissions(db, user, task)
    if not perms.can_edit_task:
        raise HTTPException(403, "لا تملك صلاحية تعديل هذه المهمة")
    return perms


async def require_transfer_task_permission(
    db: AsyncSession, user: User, task: Task
) -> TaskPermissions:
    perms = await get_task_permissions(db, user, task)
    if not perms.can_transfer_task:
        raise HTTPException(403, "لا تملك صلاحية نقل هذه المهمة إلى قسم آخر")
    return perms


async def require_delete_permission(
    db: AsyncSession, user: User, task: Task
) -> TaskPermissions:
    perms = await get_task_permissions(db, user, task)
    if not perms.can_delete_task:
        raise HTTPException(403, "لا تملك صلاحية حذف هذه المهمة")
    return perms


# ══════════════════════════════════════════════════════════════════════════════
# 5. صلاحيات المهام المتكررة
# ══════════════════════════════════════════════════════════════════════════════

def can_view_recurring_template(user: User, template: RecurringTask) -> bool:
    if AccessService.is_pm_or_admin(user):
        return True
    return template.department_id == user.department_id or template.created_by == user.id


def can_manage_recurring_template(user: User, template: RecurringTask) -> bool:
    if AccessService.is_pm_or_admin(user):
        return True
    if template.created_by == user.id:
        return True
    return (
        template.department_id == user.department_id
        and getattr(user, "is_department_manager", False)
    )
