#app/models/Task.py
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, Text, Date, DateTime, Boolean, ForeignKey, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.db.enums import TaskPriority, TaskStatus, UrgencyStatus
from .TaskWorkflowModel import TaskWorkflow
if TYPE_CHECKING:
    from app.models.User import User
    from app.models.Department import Department
    from app.models.TaskStep import TaskStep
    from app.models.TaskAssignment import TaskAssignment
    from app.models.TaskTransfer import TaskTransfer
    from app.models.TaskShare import TaskShare
    from app.models.TaskLog import TaskLog
    from app.models.Favorite import Favorite
    from app.models.Notification import Notification
    from app.models.TaskComment import TaskComment
    from app.models.TaskAttachment import TaskAttachment
    from app.models.TaskTimeLog import TaskTimeLog


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    reminder_datetime: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Eisenhower Matrix
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    is_important: Mapped[bool] = mapped_column(Boolean, default=True)

    # Priority
    priority: Mapped[TaskPriority] = mapped_column(
        SAEnum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False
    )

    # Progress & Status
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[TaskStatus] = mapped_column(
        SAEnum(TaskStatus), default=TaskStatus.NOT_STARTED, nullable=False
    )

    # Ownership
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    department_id: Mapped[int] = mapped_column(Integer, ForeignKey("departments.id"), nullable=False)

    # Urgency request
    urgency_requested_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    urgency_requested_by: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    urgency_request_status: Mapped[Optional[UrgencyStatus]] = mapped_column(
        SAEnum(UrgencyStatus), nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)

    # Relationships
    creator: Mapped["User"] = relationship(
        "User", back_populates="created_tasks", foreign_keys=[created_by]
    )
    urgency_requester: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[urgency_requested_by]
    )
    department: Mapped["Department"] = relationship("Department", back_populates="tasks")
    steps: Mapped[List["TaskStep"]] = relationship(
        "TaskStep", back_populates="task", cascade="all, delete-orphan",
        order_by="TaskStep.step_order"
    )
    assignments: Mapped[List["TaskAssignment"]] = relationship(
        "TaskAssignment", back_populates="task", cascade="all, delete-orphan"
    )
    transfers: Mapped[List["TaskTransfer"]] = relationship(
        "TaskTransfer", back_populates="task", cascade="all, delete-orphan"
    )
    shares: Mapped[List["TaskShare"]] = relationship(
        "TaskShare", back_populates="task", cascade="all, delete-orphan"
    )
    logs: Mapped[List["TaskLog"]] = relationship(
        "TaskLog", back_populates="task", cascade="all, delete-orphan"
    )
    favorites: Mapped[List["Favorite"]] = relationship(
        "Favorite", back_populates="task", cascade="all, delete-orphan"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="related_task"
    )
    
    # مضاف حديثاً للربط مع الميزات الجديدة
    comments: Mapped[List["TaskComment"]] = relationship(
        "TaskComment", back_populates="task", cascade="all, delete-orphan"
    )
    attachments: Mapped[List["TaskAttachment"]] = relationship(
        "TaskAttachment", back_populates="task", cascade="all, delete-orphan"
    )
    time_logs: Mapped[List["TaskTimeLog"]] = relationship(
        "TaskTimeLog", back_populates="task", cascade="all, delete-orphan"
    )
    workflow: Mapped[Optional["TaskWorkflow"]] = relationship(
        "TaskWorkflow", back_populates="task", uselist=False, cascade="all, delete-orphan"
    )

    @property
    def eisenhower_quadrant(self) -> str:
        if self.is_urgent and self.is_important:
            return "Q1_DO_FIRST"
        elif not self.is_urgent and self.is_important:
            return "Q2_SCHEDULE"
        elif self.is_urgent and not self.is_important:
            return "Q3_DELEGATE"
        else:
            return "Q4_ELIMINATE"

    def __repr__(self):
        return f"<Task {self.id}: {self.title}>"