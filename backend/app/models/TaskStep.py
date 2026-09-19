# app/models/TaskStep.py
from __future__ import annotations
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, Text, Boolean, DateTime, ForeignKey, func, Enum, cast
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from app.db.enums import StepStatus # استيراد الـ Enum الذي عرفناه
from sqlalchemy import Enum
if TYPE_CHECKING:
    from app.models.Task import Task
    from app.models.User import User
    from app.models.Department import Department

class TaskStep(Base):
    __tablename__ = "task_steps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    step_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_parallel: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # استخدام الـ Enum هنا
    status: Mapped[StepStatus] = mapped_column(
        PG_ENUM(
            "pending", "in_progress", "completed", "skipped",
            name="step_status",
            create_type=True
        ),
        default="pending",
        server_default="pending"
    )
    assigned_department_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("departments.id"), nullable=True)
    assigned_user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="steps")
    assignee: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_user_id])
    department: Mapped[Optional["User"]] = relationship("Department", foreign_keys=[assigned_department_id])
    completed_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[completed_by])
    @property
    def is_completed(self) -> bool:
        """
        خاصية محسوبة ترجع True إذا كانت الخطوة مكتملة بناءً على الشروط:
        1. status هي 'completed'
        2. أو تم تحديد تاريخ اكتمال (completed_at)
        3. أو تم تحديد من قام بالاكتمال (completed_by)
        """
        return (
            self.status == "completed" or 
            self.completed_at is not None or 
            self.completed_by is not None
        )