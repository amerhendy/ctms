from sqlalchemy import Integer, String, Text, Float
from sqlalchemy.orm import Mapped, mapped_column,relationship

from db.base import Base
from models.mixins import TimestampMixin, UUIDPKMixin


class JobModel(Base, UUIDPKMixin, TimestampMixin):
    """نموذج الوظيفة (يحدد مدة الاختبار ومجموعة الأسئلة المرتبطة به)."""
    __tablename__ = "job_models"

    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    count_questions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    target_score: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
