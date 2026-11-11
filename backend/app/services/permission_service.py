# app/services/permission_service.py
"""
⚠️  هذا الملف أصبح re-export فقط.
كل المنطق انتقل إلى app/services/access_service.py

احتفظ بهذا الملف مؤقتاً لتجنب كسر أي import موجود،
ثم أزل الـ imports القديمة تدريجياً من باقي الكود.
"""
from app.services.access_service import (   # noqa: F401
    AccessService,
    can_view_task,
    can_edit_task,
    can_manage_task_db as can_manage_task,
    can_transfer_task,
    can_share_externally,
    has_delegated_permission,
    get_task_share_permission,
    get_user_accessible_tasks_filter,
    can_view_user,
    can_view_department,
    is_manager_of,
)
