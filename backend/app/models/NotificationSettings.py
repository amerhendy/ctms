#app/models/NotificationSettings.py
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, Date, DateTime, Boolean, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
if TYPE_CHECKING:
    from .User import User
    
class NotificationSettings(Base):
    __tablename__ = "notification_settings"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    
    # القنوات - افتراضياً False حتى يفعّلها المستخدم
    browser: Mapped[bool] = mapped_column(default=False)
    email: Mapped[bool] = mapped_column(default=False)
    whatsapp: Mapped[bool] = mapped_column(default=False)
    telegram: Mapped[bool] = mapped_column(default=False)
    sms: Mapped[bool] = mapped_column(default=False)
    google: Mapped[bool] = mapped_column(default=False)
    #relation
    user: Mapped[User] = relationship("User", back_populates="notification_settings")