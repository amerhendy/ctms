from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
from app.db.enums import StepStatus
from sqlalchemy.dialects.postgresql import ENUM as PGEnum

class TaskWorkflowStep(Base):
    """
    خطوة فعلية في workflow مهمة معينة.

    منطق التسلسل vs التوازي:
    - step_order = 1, is_parallel = False → خطوة منفردة لازم تخلص قبل اللي بعدها
    - step_order = 2, is_parallel = True  ┐ الاتنين بيبدأوا مع بعض
    - step_order = 2, is_parallel = True  ┘ (نفس الـ order)
    - step_order = 3, is_parallel = False → بتستنى كل خطوات order=2 تخلص
    """
    __tablename__ = "task_workflow_steps"

    id                     = Column(Integer, primary_key=True, index=True)
    workflow_id            = Column(Integer, ForeignKey("task_workflows.id", ondelete="CASCADE"),
                                   nullable=False)
    title                  = Column(String(255), nullable=False)
    description            = Column(Text, nullable=True)
    step_order             = Column(Integer, nullable=False)
    is_parallel            = Column(Boolean, default=False, nullable=False)
    version                = Column(Integer, default=1, nullable=False)
    deleted_at             = Column(DateTime, nullable=True, index=True)
    assigned_department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"),
                                   nullable=True)
    assigned_user_id       = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"),
                                   nullable=True)
    status = Column(
        PGEnum(
            "pending", "in_progress", "completed", "cancelled",
            name="step_status",
            create_type=True
        ),
        default="pending",  # استخدم القيمة الحرفية مباشرة
        nullable=False
    )
    notes                  = Column(Text, nullable=True)          # ملاحظة عند الإنهاء
    completed_by           = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"),
                                   nullable=True)
    started_at             = Column(DateTime, nullable=True)
    completed_at           = Column(DateTime, nullable=True)
    created_at             = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at             = Column(DateTime, server_default=func.now(), onupdate=func.now(),
                                   nullable=False)

    # العلاقات
    workflow            = relationship("TaskWorkflow", back_populates="steps")
    #dependencies        = relationship("TaskStepDependency", foreign_keys="[TaskStepDependency.child_step_id]",back_populates="child_step")
    assigned_department = relationship("Department", foreign_keys=[assigned_department_id])
    assigned_user       = relationship("User", foreign_keys=[assigned_user_id])
    completer           = relationship("User", foreign_keys=[completed_by])
