#app/models/RecurringTaskStepModel.py
from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, Text, DateTime, Boolean, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.RecurringTaskModel import RecurringTask
    from app.models.Department import Department
    from app.models.User import User


class RecurringTaskStep(Base):
    __tablename__ = "recurring_task_steps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    recurring_task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("recurring_tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    step_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_parallel: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    assigned_department_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("departments.id"), nullable=True
    )
    assigned_user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)

    # Relationships
    recurring_task: Mapped["RecurringTask"] = relationship(
        "RecurringTask", back_populates="steps"
    )
    assigned_department: Mapped[Optional["Department"]] = relationship("Department")
    assigned_user: Mapped[Optional["User"]] = relationship("User")

    __table_args__ = (
        CheckConstraint(
            "(assigned_department_id IS NOT NULL AND assigned_user_id IS NULL) OR "
            "(assigned_department_id IS NULL AND assigned_user_id IS NOT NULL)",
            name="chk_recurring_step_assignment_xor"
        ),
    )

    def __repr__(self):
        return f"<RecurringTaskStep {self.id}: {self.title}>"