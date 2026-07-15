#app/modes/Department.py
from __future__ import annotations

from datetime import datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from .Location import Location
    from .JobLevel import JobLevel
    from .User import User
    from .Task import Task
    from .RecurringTask import RecurringTask
    from .DepartmentManager import DepartmentManager

class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_department_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    location_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("locations.id", ondelete="SET NULL"), nullable=True
    )
    job_level_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("job_levels.id"), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    location: Mapped[Optional["Location"]] = relationship("Location", back_populates="departments")
    parent: Mapped[Optional["Department"]] = relationship(
        "Department", remote_side=[id], backref="children"
    )
    job_level: Mapped[Optional[JobLevel]] = relationship("JobLevel", back_populates="departments")
    users: Mapped[List["User"]] = relationship("User", back_populates="department")
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="department")
    recurring_tasks: Mapped[List["RecurringTask"]] = relationship("RecurringTask", back_populates="department")
    
    managers: Mapped[List["DepartmentManager"]] = relationship(
        "DepartmentManager", 
        back_populates="department",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        # استخدام dict.get يمنع محاولة طلب البيانات من الداتابيز إذا كانت الجلسة مغلقة
        dept_id = self.__dict__.get('id', 'Unknown')
        dept_name = self.__dict__.get('name', 'Unknown')
        return f"<Department {dept_id}: {dept_name}>"
