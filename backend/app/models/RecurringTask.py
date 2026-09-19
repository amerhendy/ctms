#app/models/RecurringTask.py
from __future__ import annotations

from datetime import date, datetime, time
from typing import Optional, List, TYPE_CHECKING

from app.models.TaskLog import TaskLog
from sqlalchemy import Integer, String, Text, Date, DateTime, Boolean, Time, ForeignKey, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.db.enums import TaskPriority, RecurrencePattern

if TYPE_CHECKING:
    from app.models.Department import Department
    from app.models.User import User
    from app.models.RecurringTaskLog import RecurringTaskLog


class RecurringTask(Base):
    __tablename__ = "recurring_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    department_id: Mapped[int] = mapped_column(Integer, ForeignKey("departments.id"), nullable=False)
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    
    priority: Mapped[TaskPriority] = mapped_column(
        SAEnum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False
    )
    recurrence_pattern: Mapped[RecurrencePattern] = mapped_column(
        SAEnum(RecurrencePattern), nullable=False
    )
    interval_value: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    day_of_week: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    day_of_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    next_run_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    run_time: Mapped[time] = mapped_column(Time, nullable=False, default="08:00:00")
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)

    # Relationships
    department: Mapped["Department"] = relationship("Department", back_populates="recurring_tasks")
    creator: Mapped["User"] = relationship("User", back_populates="created_recurring_tasks", foreign_keys=[created_by])
    change_logs: Mapped[List["TaskLog"]] = relationship(
        "TaskLog", back_populates="recurring_task"
    )
    execution_logs: Mapped[List["RecurringTaskLog"]] = relationship(
        "RecurringTaskLog", back_populates="recurring_task"
    )

    def __repr__(self):
        return f"<RecurringTask {self.id}: {self.title}>"