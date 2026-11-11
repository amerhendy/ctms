from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base
from models.mixins import UUIDPKMixin


class Violation(Base, UUIDPKMixin):
    """مخالفة مرصودة أثناء أداء الاختبار (تبديل تبويب، نسخ/لصق، ...)."""
    __tablename__ = "violations"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("applicants.id"), nullable=False)
    violation_type: Mapped[str] = mapped_column(String(30), nullable=False)
    
    # استخدام Optional لضمان التوافق التام مع فاحص الأنماط static type checking
    details: Mapped[str] = mapped_column(Text, nullable=True)
    
    # تحديث حقل توقيت المخالفة لدعم UTC والتخلص من utcnow
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        nullable=False
    )