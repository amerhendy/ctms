from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base
from models.mixins import TimestampMixin, UUIDPKMixin


class Applicant(Base, UUIDPKMixin, TimestampMixin):
    """متقدم لأداء اختبار التوظيف."""
    __tablename__ = "applicants"

    national_id: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(128), nullable=False)
    
    # يفضل استخدام Optional[str] ليكون التنميط دقيقاً مع static type checkers مثل Mypy
    phone: Mapped[str] = mapped_column(String(32), nullable=True)
    
    job_model_id: Mapped[str] = mapped_column(String(36), ForeignKey("job_models.id"), nullable=False)
    access_code: Mapped[str] = mapped_column(String(16), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # pending, in_progress, finished

    # إضافة timezone=True لحقول التواريخ والوقت
    exam_started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    exam_finished_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # تحديد server_default أو default للأرقام لتجنب أي قيم فارغة بدلاً من Zero
    total_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=True)
    max_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=True)