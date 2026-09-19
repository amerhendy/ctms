#app/models/TaskTimeLog.py
from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Integer, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Computed

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.Task import Task
    from app.models.User import User


class TaskTimeLog(Base):
    __tablename__ = "task_time_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    stopped_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # في SQLAlchemy نقوم بعمل المحاكاة البرمجية للـ Generated Column في بوسطجرس بهذا الشكل:
    duration_minutes: Mapped[Optional[int]] = mapped_column(
        Integer,
        Computed("EXTRACT(EPOCH FROM (stopped_at - started_at)) / 60", persisted=True)
    )

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="time_logs")
    user: Mapped["User"] = relationship("User", back_populates="time_logs")
    
    def __repr__(self):
        return f"<TaskTimeLog user={self.user_id} task={self.task_id}>"