from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base
from models.mixins import TimestampMixin, UUIDPKMixin


class Session(Base, UUIDPKMixin, TimestampMixin):
    """
    جلسات الدخول المخزّنة في قاعدة البيانات، وتُستخدم لكل من الأدمن
    والمتقدمين (subject_type يميّز النوع). يحمل كل تسجيل دخول رمز جلسة
    (Token) فريد وتاريخ انتهاء صلاحية.
    """
    __tablename__ = "sessions"

    subject_type: Mapped[str] = mapped_column(String(20), nullable=False)  # admin | applicant
    subject_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    token: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    
    # تحديث الحقل ليدعم المناطق الزمنية UTC
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        Index("ix_sessions_subject", "subject_type", "subject_id"),
    )