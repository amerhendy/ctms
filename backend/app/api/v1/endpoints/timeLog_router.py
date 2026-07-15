import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from pydantic import BaseModel, Field,field_validator
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload, with_loader_criteria
from typing import Optional, List
from datetime import datetime, time
from app.db.session import get_db
from app.db.enums import TaskStatus
from app.models import (User, Task, TaskTimeLog)

from app.core.security import get_current_user
from app.core.permissions import get_task_permissions

from app.services.log_service import LogService
from app.schemas.base import get_task_or_404
# إنشاء الـ Router الخاص بالمهام مع البادئة والوسم التعريفي للـ Swagger Docs
router = APIRouter(prefix="/TimeLog", tags=["Task Time Log -الوقت الفعلي المستغرق"])
@router.post("/{task_id}/start")
async def start_time_log(
    task_id: int,
    note: Optional[str] = Query(None, description="ملاحظة اختيارية عند بدء العمل"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    بدء تشغيل عداد الوقت لحساب الساعات والدقائق الفعلية.
    - الصلاحية: صلاحية تغيير حالة المهمة (can_change_status)
    """
    task = await get_task_or_404(db, task_id)
    
    # التحقق من صلاحية تغيير الحالة
    perms = await get_task_permissions(db, current_user, task)
    if not perms.can_change_status:
        raise HTTPException(403, "غير مصرح لك بتسجيل وقت في هذه المهمة")
        
    # منع تشغيل مؤقتين لنفس المستخدم والمهمة
    active_log = await db.execute(
        select(TaskTimeLog).where(
            TaskTimeLog.task_id == task_id,
            TaskTimeLog.user_id == current_user.id,
            TaskTimeLog.stopped_at == None
        )
    )
    if active_log.scalar_one_or_none():
        raise HTTPException(400, "المؤقت قيد التشغيل بالفعل على جهازك لهذه المهمة")
        
    time_log = TaskTimeLog(
        task_id=task_id,
        user_id=current_user.id,
        started_at=datetime.now(),
        note=note
    )
    db.add(time_log)
    
    # ========================================================
    # التعديل الفني: تم تغيير PENDING إلى NOT_STARTED لتطابق الـ Enum تماماً
    if task.status == TaskStatus.NOT_STARTED:
        task.status = TaskStatus.IN_PROGRESS
    # ========================================================
        
    await LogService.log_action(
        db, task_id, current_user.id, "time_log_started",
        extra_data=f"بدء العمل على المهمة بواسطة {current_user.full_name}"
    )
    await db.commit()
    return {"id": time_log.id, "message": "تم تشغيل عداد الوقت بنجاح"}


@router.post("/{task_id}/stop")
async def stop_time_log(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    إيقاف مؤقت العمل الفعلي وحفظ الوقت المستغرق.
    - الصلاحية: صلاحية تغيير حالة المهمة (can_change_status)
    """
    task = await get_task_or_404(db, task_id)
    
    # التحقق من صلاحية تغيير الحالة
    perms = await get_task_permissions(db, current_user, task)
    if not perms.can_change_status:
        raise HTTPException(403, "غير مصرح لك بتسجيل وقت في هذه المهمة")
    
    # البحث عن المؤقت المفتوح
    result = await db.execute(
        select(TaskTimeLog).where(
            TaskTimeLog.task_id == task_id,
            TaskTimeLog.user_id == current_user.id,
            TaskTimeLog.stopped_at == None
        )
    )
    time_log = result.scalar_one_or_none()
    if not time_log:
        raise HTTPException(400, "لا يوجد مؤقت قيد العمل حالياً ليتم إيقافه")
        
    time_log.stopped_at = datetime.now()
    
    # حساب المدة
    duration = time_log.stopped_at - time_log.started_at
    if hasattr(time_log, 'duration_seconds'):
        time_log.duration_seconds = int(duration.total_seconds())
    
    await LogService.log_action(
        db, task_id, current_user.id, "time_log_stopped",
        extra_data=f"إيقاف العمل على المهمة بواسطة {current_user.full_name}، المدة: {duration}"
    )
    await db.commit()
    return {"message": "تم إيقاف العداد وحفظ الوقت المستغرق"}
@router.get("/{task_id}/logs")
async def get_task_time_logs(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    جلب جميع سجلات الأوقات المحفوظة الخاصة بهذه المهمة لعرضها في تبويب السجل.
    """
    # التحقق من وجود المهمة أولاً
    task = await get_task_or_404(db, task_id)
    
    # جلب السجلات مرتبة من الأحدث إلى الأقدم
    result = await db.execute(
        select(TaskTimeLog)
        .where(TaskTimeLog.task_id == task_id)
        .order_by(TaskTimeLog.started_at.desc())
    )
    logs = result.scalars().all()
    
    # إرجاع البيانات بصيغة نظيفة للفرونت إند
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "user_name": log.user.full_name if log.user else "مستخدم غير معروف",
            "started_at": log.started_at,
            "stopped_at": log.stopped_at,
            "note": log.note,
            "duration_minutes": log.duration_minutes
        }
        for log in logs
    ]
