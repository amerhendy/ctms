from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base
from models.mixins import UUIDPKMixin


class Response(Base, UUIDPKMixin):
    """إجابة متقدم على سؤال معين (سجل واحد لكل زوج متقدم/سؤال)."""
    __tablename__ = "responses"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("applicants.id"), nullable=False)
    question_id: Mapped[str] = mapped_column(String(36), ForeignKey("questions.id"), nullable=False)
    
    # تحسين التنميط ليتوافق مع nullable=True
    answer_data: Mapped[str] = mapped_column(Text, nullable=True)  # JSON مخزّن كنص
    
    is_correct: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    # التعديل الرئيسي: دعم UTC بالكامل واستبدال datetime.utcnow
    answered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        nullable=False
    )

    __table_args__ = (UniqueConstraint("user_id", "question_id", name="uq_user_question"),)