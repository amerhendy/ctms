#app/models/jobLevel.py
from __future__ import annotations  # هامة جداً لتمكين كتابة اسم الكلاس كنص أو تلميح بدون قراءته فوراً
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

# ─── حل مشكلة الـ Circular Import باستخدام TYPE_CHECKING ───
if TYPE_CHECKING:
    from app.models.users import User
    # من المفترض أن يكون لديك ملف للـ Departments أيضاً مستقبلاً:
    # from app.models.departments import Department

class JobLevel(Base):
    __tablename__ = "job_levels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    level_number: Mapped[int] = mapped_column(Integer, nullable=False, unique=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="job_level")
    departments: Mapped[List["Department"]] = relationship("Department", back_populates="job_level")

    def __repr__(self):
        return f"<JobLevel {self.level_number}: {self.title}>"