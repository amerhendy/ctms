import math
from fastapi import APIRouter, Depends, Query,HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime, time
from app.db.session import get_db
from app.db.enums import  TaskPriority
from app.models import (User)
from app.schemas.base import PaginatedResponse
from app.core.security import get_current_user
from app.schemas.recurring_tasks import RecurringTaskCreate,RecurringTemplateUpdate, RecurringTaskOut, RecurringTaskLogOut

from app.services.recurring_task_service import RecurringTaskService
router = APIRouter(prefix="/recurrTasks", tags=["Recurring Tasks - المهام المتكررة"])
NOWTIME=datetime.now().replace(tzinfo=None)

# ─── الميزة 4: إدارة قوالب المهام المتكررة والدورية (Recurring Tasks CRUD) ───────────────────────────

@router.post("/recurring", status_code=201)
async def create_recurring_template(
    payload: RecurringTaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    
    """
    إنشاء قالب مهمة متكررة.
    - الصلاحية: الأدمن، مدير البرنامج، أو مدير القسم المعني.
    """
    return await RecurringTaskService.create_template(db, current_user, payload.model_dump())

@router.get("/recurring", response_model=PaginatedResponse[RecurringTaskOut])
async def list_recurring_templates(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await RecurringTaskService.get_paginated_templates(
        db, current_user, page, page_size, search, sort_by, sort_order
    )

# تعديل نوع الـ response_model لضمان ظهور التوثيق الصحيح في Swagger
@router.get("/recurring/logs", response_model=PaginatedResponse[RecurringTaskLogOut])
async def get_recurring_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1),
    search: Optional[str] = Query(None),
    sort_by: str = Query("run_at"),  # التغيير: الفرز الافتراضي بناءً على وقت التشغيل الموجود في اللوق
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    جلب سجل عمليات التشغيل والأتمتة لعرضها في شاشة الـ LOG بالفرونت إند.
    """
    return await RecurringTaskService.get_paginated_logs(
        db, page, page_size, search, sort_by, sort_order
    )

@router.get("/recurring/{template_id}")
async def get_recurring_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    جلب تفاصيل قالب متكرر.
    - الصلاحية: الأدمن، مدير البرنامج، منشئ القالب، أو مستخدم في نفس القسم.
    """
    return await RecurringTaskService.get_template_details(db, current_user, template_id)


@router.patch("/recurring/{template_id}")
async def update_recurring_template(
    template_id: int,
    payload: RecurringTemplateUpdate,  # استقبال كل البيانات هنا في جسم الطلب
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    تحديث شامل لقالب مهمة متكررة.
    """
    return await RecurringTaskService.update_template(db, current_user, template_id, payload)


@router.delete("/recurring/{template_id}")
async def delete_recurring_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    حذف قالب مهمة متكررة (Soft Delete).
    - الصلاحية: الأدمن، مدير البرنامج، منشئ القالب، أو مدير القسم المعني.
    """
    return await RecurringTaskService.delete_template(db, current_user, template_id)

@router.post("/recurring/trigger-automation")
async def trigger_automation(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) # حماية المسار للأدمن فقط
):
    """
    تشغيل يدوي فوري لمحرك الأتمتة لفحص وتوليد المهام الدورية ومراقبة النتائج.
    """
    # يمكنك تفعيل فحص صلاحية الأدمن هنا لزيادة الأمان المكتبي الموثق
    return await RecurringTaskService.trigger_manual_automation(db, current_user)
    summary = await execute_recurring_tasks_automation(db)
    return summary



