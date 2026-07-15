# app/models/TaskStep.py
from __future__ import annotations
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, Text, Boolean, DateTime, ForeignKey, func, Enum, cast
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship,remote
from app.db.session import Base
from app.db.enums import StepStatus # استيراد الـ Enum الذي عرفناه
from app.models.TaskStepDependency_Model import TaskStepDependency

from sqlalchemy import Enum
if TYPE_CHECKING:
    from app.models.Task import Task
    from app.models.User import User
    from app.models.Department import Department
status_values = [item.value for item in StepStatus]  
class TaskStep(Base):
    __tablename__ = "task_steps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    step_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_parallel: Mapped[bool] = mapped_column(Boolean, default=False)
    parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("task_steps.id", ondelete="CASCADE"), nullable=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # استخدام الـ Enum هنا
    status: Mapped[StepStatus] = mapped_column(PG_ENUM(*status_values,name="step_status",create_type=True),default="pending",server_default="pending")
    #status: Mapped[StepStatus] = mapped_column(Enum(StepStatus), default=StepStatus.PENDING, nullable=False)
    assigned_department_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("departments.id"), nullable=True)
    assigned_user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="steps")
    assignee: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_user_id])
    department: Mapped[Optional["Department"]] = relationship("Department", foreign_keys=[assigned_department_id])
    completed_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[completed_by])
    dependencies        = relationship("TaskStepDependency", foreign_keys="[TaskStepDependency.child_step_id]",back_populates="child_step")
    parent = relationship("TaskStep", remote_side=[id], back_populates="children")
    children = relationship(
        "TaskStep", 
        back_populates="parent", 
        cascade="all, delete-orphan",
        #primaryjoin="and_(TaskStep.id==TaskStep.parent_id, TaskStep.deleted_at.is_(None))"
        primaryjoin="and_(TaskStep.id == remote(TaskStep.parent_id), remote(TaskStep.deleted_at).is_(None))"
    )
    @property
    def is_completed(self) -> bool:
        """
        خاصية محسوبة ترجع True إذا كانت الخطوة مكتملة بناءً على الشروط:
        1. status هي 'completed'
        2. أو تم تحديد تاريخ اكتمال (completed_at)
        3. أو تم تحديد من قام بالاكتمال (completed_by)
        return (
            self.status == "completed" or 
            self.completed_at is not None or 
            self.completed_by is not None
        )
        """
        return self.status == StepStatus.COMPLETED