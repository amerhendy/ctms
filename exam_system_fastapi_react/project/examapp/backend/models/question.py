from typing import Optional

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from db.base import Base
from models.mixins import TimestampMixin, UUIDPKMixin


class Question(Base, UUIDPKMixin, TimestampMixin):
    """سؤال اختبار مرتبط بنموذج وظيفة معين."""
    __tablename__ = "questions"

    job_model_id: Mapped[str] = mapped_column(String(36), ForeignKey("job_models.id"), nullable=False)
    q_type: Mapped[str] = mapped_column(String(30), nullable=False)  # mcq, excel_formula, code_correction, language_check
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_data: Mapped[str] = mapped_column(Text, nullable=False)  # JSON مخزّن كنص
    
    # تحسين التنميط ليتوافق مع nullable=True
    image_path: Mapped[str] = mapped_column(String(255), nullable=True)
    
    points: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)