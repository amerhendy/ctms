#app/models/UserLogs.py
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, Date, DateTime, Boolean, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
if TYPE_CHECKING:
    from .User import User

from sqlalchemy import JSON

class UserLog(Base):
    __tablename__ = "user_logs"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    
    action: Mapped[str] = mapped_column()  # مثلاً: "update_settings", "login", "update_profile"
    old_data: Mapped[dict] = mapped_column(JSON, nullable=True) # التخزين كـ JSON
    new_data: Mapped[dict] = mapped_column(JSON, nullable=True) # التخزين كـ JSON
    
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    #relation
    user: Mapped[User] = relationship("User", back_populates="logs")