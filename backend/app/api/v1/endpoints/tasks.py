"""
Tasks API – Complete CRUD + Steps + Assignments + Urgency + Favorites
مطور ليشمل: التعليقات، المرفقات، سجلات الوقت، والمهام المتكررة (CRUD)
"""
import os
import shutil
from fastapi import UploadFile, File, Request, BackgroundTasks
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field,field_validator
from typing import Optional
from app.services.task_service import TaskService
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload, with_loader_criteria
from typing import Optional, List
from datetime import datetime, time
from app.db.session import get_db
from app.db.enums import GlobalRole, TaskStatus, TaskPriority, AssignmentType, UrgencyStatus
# استيراد الموديلات الجديدة (TaskComment, TaskAttachment, TaskTimeLog, RecurringTask) لربطها بقاعدة البيانات
from app.models import (
    User, Task, TaskStep, TaskAssignment, TaskShare, Favorite,
    TaskComment, TaskAttachment, TaskTimeLog, RecurringTask,RecurringTaskLog,TaskTransfer,TaskLog
) 
from app.services.automation import execute_recurring_tasks_automation
# استيراد مخططات البيانات الـ Pydantic للتحقق من المدخلات والمخرجات
from app.schemas.base import PaginatedResponse,task_query_with_relations,get_task_or_404,apply_pagination
from app.schemas.tasks import TaskCreate,TaskUpdate,TaskOut,TaskListItem
from app.schemas.urgency import UrgencyRequest, UrgencyAction, TaskUrgencyOut

from app.core.security import get_current_user
from app.core.permissions import require_view_permission, get_task_permissions,require_delete_permission,can_manage_recurring_template,can_view_recurring_template
from app.services.permission_service import can_view_task, can_edit_task, can_manage_task
from app.services.log_service import LogService
from app.services.notification_service import NotificationService
from app.models import Department

# إنشاء الـ Router الخاص بالمهام مع البادئة والوسم التعريفي للـ Swagger Docs
router = APIRouter(prefix="/tasks", tags=["Tasks"])
NOWTIME=datetime.now().replace(tzinfo=None)
# ─── جلب وقائمة وعمليات البحث في المهام ───────────────────────────────────────────
@router.get("", response_model=dict)
async def list_tasks(
    status: Optional[str] = Query(None),
    priority: Optional[TaskPriority] = None,
    is_urgent: Optional[bool] = None,
    department_id: Optional[int] = None,
    assigned_to_me: bool = False,
    favorites_only: bool = False,
    q: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = "created_at",    # 🌟 أضفناها لدعم الفرز الديناميكي
    sort_order: str = "desc",                 # 🌟 أضفناها لدعم الفرز الديناميكي
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    جلب قائمة بالمهام متوافقة بالكامل مع محرك الأتمتة والترقيم الموحد في النظام.
    """
    filters = {"status": status, "q": q, "priority": priority, "is_urgent": is_urgent, "department_id": department_id, "date_from": date_from, "date_to": date_to, "assigned_to_me": assigned_to_me, "favorites_only": favorites_only}
    pagination = {"page": page, "page_size": page_size, "sort_by": sort_by, "sort_order": sort_order}
    
    # استدعاء الخدمة فقط!
    return await TaskService.get_paginated_tasks(db, current_user, filters, pagination)


# ─── إنشاء مهمة جديدة ─────────────────────────────────────────────

@router.post("", status_code=201)
async def create_task(
    data: TaskCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    إنشاء مهمة جديدة مع خطواتها والموظفين المعينين وإرسال الإشعارات وتوثيق العملية في سجل النظام
    """
    task = await TaskService.create_new_task(db, data, current_user, background_tasks)
    return {"id": task.id, "message": "تم إنشاء المهمة بنجاح"}

# ─── جلب تفاصيل مهمة محددة ────────────────────────────────────────────────

@router.get("/{task_id}")
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    جلب تفاصيل المهمة الأساسية مع تطبيق ترقيم ميكرو (Micro-Pagination) للقوائم التابعة لمنع الـ Overloading.
    """
    return await TaskService.get_task_details(db=db,task_id=task_id,current_user=current_user)

@router.patch("/{task_id}")
async def update_task(
    task_id: int,
    data: TaskUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TaskService.update_task(db, task_id, data, current_user, background_tasks)
    

@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    حذف منطقي (Soft Delete) للمهمة: تعيين deleted_at وتحذير جميع المستخدمين المعنيين.
    لا يتم حذف المرفقات الفعلية من القرص تلقائياً (يمكن جدولة مهمة لاحقة لتنظيفها).
    """
    return await TaskService.delete_task(db, task_id, current_user, background_tasks)
    
    
@router.post("/{task_id}/request-urgency")
async def request_urgency(
    task_id: int,
    data: UrgencyRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    تقديم طلب استعجال رسمي للمهمة.
    الصلاحية: المنشئ، مدير القسم، مدير البرنامج (can_request_urgency)
    """
    return await TaskService.request_urgency_task(db, task_id, data, current_user, background_tasks)

@router.post("/{task_id}/respond-urgency")
async def respond_urgency(
    task_id: int,
    data: UrgencyAction,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    الرد على طلب الاستعجال (قبول أو رفض).
    الصلاحية: مدير البرنامج، الأدمن، المنشئ، مدير القسم، المنفذون، المشاركون (can_respond_urgency)
    """
    return await TaskService.respond_urgency_task(db, task_id, data, current_user, background_tasks)


# ─── المفضلة (Favorites) ───────────────────────────────────────────────




# ─── سجل التوثيق والعمليات الخاص بالمهمة (Task Logs) ───────────────────────────────────────────────

@router.get("/{task_id}/logs")
async def get_task_logs(
    task_id: int,
    page: int = Query(1, ge=1, description="رقم الصفحة الحالية"),
    limit: int = Query(20, ge=1, le=50, description="عدد Audit Log في الصفحة الواحدة"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    استعراض خط سير العمل والعمليات (Audit Log) التي تمت على المهمة من البداية وحتى اللحظة لضمان الشفافية الإدارية.
    - الصلاحية: أي مستخدم يملك صلاحية عرض المهمة (can_view)
    """
    return await LogService.get_task_logs(db, task_id, current_user, page, limit)
    

@router.post("/{task_id}/favorite")
async def toggle_favorite(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    إضافة أو إزالة المهمة من المفضلة الخاصة بالموظف الحالي (Toggle)
    - الصلاحية: أي مستخدم يملك صلاحية عرض المهمة يمكنه تفضيلها (can_view)
    """
    return await TaskService.toggle_favorite(db, task_id, current_user)
    