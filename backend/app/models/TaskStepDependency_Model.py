from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class TaskStepDependency(Base):
    """
    جدول يحدد الاعتماديات بين الخطوات (DAG).
    الخطوة 'child' لا يمكنها البدء إلا إذا انتهت 'parent'.
    """
    __tablename__ = "task_step_dependencies"

    id              = Column(Integer, primary_key=True, index=True)
    parent_step_id  = Column(Integer, ForeignKey("task_steps.id", ondelete="CASCADE"), nullable=False)
    child_step_id   = Column(Integer, ForeignKey("task_steps.id", ondelete="CASCADE"), nullable=False)

    # العلاقات
    parent_step = relationship("TaskStep", foreign_keys=[parent_step_id])
    child_step  = relationship("TaskStep", foreign_keys=[child_step_id], back_populates="dependencies")