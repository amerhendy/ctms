#app/models/TaskShare.py
from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.db.enums import SharePermission

if TYPE_CHECKING:
    from app.models.Task import Task
    from app.models.User import User


class TaskShare(Base):
    __tablename__ = "task_shares"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    shared_with_user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    permission: Mapped[SharePermission] = mapped_column(
        SAEnum(SharePermission), default=SharePermission.VIEW, nullable=False
    )
    shared_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False)
    approval_status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    approved_by: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    __table_args__ = (UniqueConstraint("task_id", "shared_with_user_id", name="uq_share"),)

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="shares")
    shared_with: Mapped["User"] = relationship(
        "User",
        foreign_keys=[shared_with_user_id],
        back_populates="shared_tasks"
    )

    sharer: Mapped["User"] = relationship(
        "User",
        foreign_keys=[shared_by],
        back_populates="shared_by_me"
    )

    approver: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[approved_by]
    )

    def __repr__(self):
        return f"<TaskShare task={self.task_id} user={self.shared_with_user_id}>"