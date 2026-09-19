# app/models/TaskWorkflow.py
from sqlalchemy import Column, Integer,ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from app.db.enums import WorkflowStatus
from sqlalchemy.dialects.postgresql import ENUM as PGEnum
class TaskWorkflow(Base):
    """
    الـ Workflow المرتبط بمهمة معينة.
    كل مهمة ممكن يكون ليها workflow واحد بس.
    """
    __tablename__ = "task_workflows"

    id          = Column(Integer, primary_key=True, index=True)
    task_id     = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"),
                         nullable=False, unique=True)
    template_id = Column(Integer, ForeignKey("workflow_templates.id", ondelete="SET NULL"),
                         nullable=True)   # None = workflow مخصص بدون قالب
    status = Column(
        PGEnum(
            "pending", "in_progress", "completed", "cancelled",
            name="workflow_status",
            create_type=True
        ),
        default="pending",  # استخدم القيمة الحرفية مباشرة
        nullable=False
    )
    created_by  = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at  = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at  = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at  = Column(DateTime, nullable=True)  # None = غير محذوف

    # العلاقات
    task     = relationship("Task", back_populates="workflow")
    template = relationship("WorkflowTemplate")
    steps    = relationship("TaskWorkflowStep", back_populates="workflow",
                            order_by="TaskWorkflowStep.step_order",
                            cascade="all, delete-orphan")
    creator  = relationship("User", foreign_keys=[created_by])
