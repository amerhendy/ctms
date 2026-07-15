#app/models/TaskLog.py
from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING


from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.Task import Task
    from app.models.User import User
    from app.models import RecurringTask


class TaskLog(Base):
    __tablename__ = "task_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    task_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True
    )
    recurring_task_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("recurring_tasks.id", ondelete="SET NULL", onupdate="CASCADE"), 
        nullable=True
    )
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    old_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extra_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timestamp: Mapped[DateTime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="logs")
    recurring_task: Mapped["RecurringTask"] = relationship(
        "RecurringTask", back_populates="change_logs"
    )
    user: Mapped[Optional["User"]] = relationship("User", back_populates="task_logs")

    def __repr__(self):
        return f"<TaskLog {self.action_type} recurring_task={self.recurring_task} at={self.timestamp}>"