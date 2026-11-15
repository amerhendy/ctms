#app/models/TaskLog.py
from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.RecurringTask import RecurringTask


class RecurringTaskLog(Base):
    __tablename__ = "recurring_task_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recurring_task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("recurring_tasks.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    generated_task_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    run_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    recurring_task: Mapped["RecurringTask"] = relationship(
        "RecurringTask", back_populates="execution_logs"
    )

    def __repr__(self):
        return f"<RecurringTaskLog {self.id} task={self.recurring_task_id} status={self.status}>"