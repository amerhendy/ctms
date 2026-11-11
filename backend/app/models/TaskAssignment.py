#app/models/TaskAssignment.py
from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Integer, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.db.enums import AssignmentType

if TYPE_CHECKING:
    from app.models.Task import Task
    from app.models.User import User


class TaskAssignment(Base):
    __tablename__ = "task_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    assignment_type: Mapped[AssignmentType] = mapped_column(
        SAEnum(AssignmentType), default=AssignmentType.ASSIGNEE, nullable=False
    )
    assigned_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)

    __table_args__ = (UniqueConstraint("task_id", "user_id", name="uq_task_user"),)

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="assignments")
    user: Mapped["User"] = relationship("User", back_populates="assignments", foreign_keys=[user_id])
    assigner: Mapped["User"] = relationship("User", foreign_keys=[assigned_by])

    def __repr__(self):
        return f"<TaskAssignment task={self.task_id} user={self.user_id}>"