"""
Advanced Search API – Full-text search across tasks
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import date

from app.db.session import get_db
from app.db.enums import GlobalRole, TaskStatus, TaskPriority
from app.models import (
    User, Task, TaskShare, TaskAssignment
)
from app.core.security import get_current_user
from app.core.permissions import AccessService
router = APIRouter(prefix="/search", tags=["Search"])


@router.get("")
async def advanced_search(
    # Text search
    q: Optional[str] = None,
    file_number: Optional[str] = None,
    # Filters
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    is_urgent: Optional[bool] = None,
    is_important: Optional[bool] = None,
    department_id: Optional[int] = None,
    created_by: Optional[int] = None,
    assigned_to: Optional[int] = None,
    # Date range
    due_date_from: Optional[date] = None,
    due_date_to: Optional[date] = None,
    created_from: Optional[date] = None,
    created_to: Optional[date] = None,
    # Pagination
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Advanced task search with multiple filter criteria.
    Returns tasks accessible to the current user.
    """
    query = select(Task).options(
        selectinload(Task.creator),
        selectinload(Task.department),
    )

    # ── Access filter ──
    if AccessService._is_global_admin(current_user):
        accessible = or_(
            Task.department_id == current_user.department_id,
            Task.created_by == current_user.id,
            Task.id.in_(
                select(TaskAssignment.task_id).where(
                    TaskAssignment.user_id == current_user.id
                )
            ),
            Task.id.in_(
                select(TaskShare.task_id).where(
                    TaskShare.shared_with_user_id == current_user.id
                )
            ),
        )
        query = query.where(accessible)

    # ── Text search ──
    if q:
        text_filter = or_(
            Task.title.ilike(f"%{q}%"),
            Task.description.ilike(f"%{q}%"),
            Task.file_number.ilike(f"%{q}%"),
        )
        query = query.where(text_filter)

    if file_number:
        query = query.where(Task.file_number.ilike(f"%{file_number}%"))

    # ── Status/Priority filters ──
    if status:
        query = query.where(Task.status == status)
    if priority:
        query = query.where(Task.priority == priority)
    if is_urgent is not None:
        query = query.where(Task.is_urgent == is_urgent)
    if is_important is not None:
        query = query.where(Task.is_important == is_important)
    if department_id:
        query = query.where(Task.department_id == department_id)
    if created_by:
        query = query.where(Task.created_by == created_by)

    # ── Assigned to filter ──
    if assigned_to:
        query = query.where(
            Task.id.in_(
                select(TaskAssignment.task_id).where(
                    TaskAssignment.user_id == assigned_to
                )
            )
        )

    # ── Date filters ──
    if due_date_from:
        query = query.where(Task.due_date >= due_date_from)
    if due_date_to:
        query = query.where(Task.due_date <= due_date_to)
    if created_from:
        query = query.where(func.date(Task.created_at) >= created_from)
    if created_to:
        query = query.where(func.date(Task.created_at) <= created_to)

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    # Paginate & sort
    query = query.order_by(Task.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    tasks = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": t.id,
                "title": t.title,
                "file_number": t.file_number,
                "priority": t.priority.value,
                "status": t.status.value,
                "is_urgent": t.is_urgent,
                "is_important": t.is_important,
                "due_date": t.due_date.isoformat() if t.due_date else None,
                "progress_percentage": t.progress_percentage,
                "department_id": t.department_id,
                "department_name": t.department.name if t.department else None,
                "created_by": t.created_by,
                "creator_name": t.creator.full_name if t.creator else None,
                "eisenhower_quadrant": t.eisenhower_quadrant,
                "created_at": t.created_at.isoformat(),
            }
            for t in tasks
        ],
    }
