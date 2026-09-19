#app/models/Delegation.py
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, Date, DateTime, Boolean, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
if TYPE_CHECKING:
    from .User import User
    
class Delegation(Base):
    __tablename__ = "delegations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    delegator_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    delegate_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    permission_types: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    delegator: Mapped[User] = relationship(
        "User", back_populates="delegations_given", foreign_keys=[delegator_id]
    )
    delegate: Mapped[User] = relationship(
        "User", back_populates="delegations_received", foreign_keys=[delegate_id]
    )

    @property
    def permissions(self) -> List[str]:
        return [p.strip() for p in self.permission_types.split(",") if p.strip()]

    def __repr__(self):
        return f"<Delegation from={self.delegator_id} to={self.delegate_id}>"
