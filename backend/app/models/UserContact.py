# UserContact.py
from __future__ import annotations

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base   # غيّر المسار إلى app.db.session حسب هيكلك الفعلي

if TYPE_CHECKING:
    from app.models.User import User   # غيّر المسار حسب هيكلك
    


class UserContact(Base):
    __tablename__ = "user_contacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # ربط المفتاح الأجنبي مع جدول المستخدمين وتفعيل الحذف التلقائي ON DELETE CASCADE
    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        unique=True, 
        nullable=False
    )
    
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    whatsapp_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    telegram_username: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    extension_number: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    
    # حقل الخصوصية المطلوبة للتحقق من الصلاحيات لاحقاً
    is_private: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # ─── العلاقات (Relationships) ───
    # ربط جهة الاتصال بالمستخدم (العلاقة العكسية contacts موجودة في User)
    user: Mapped["User"] = relationship("User", back_populates="contacts")

    def __repr__(self):
        return f"<UserContact id={self.id} user_id={self.user_id}>"