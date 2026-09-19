from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class WorkflowTemplateStep(Base):
    """خطوة داخل قالب الـ Workflow"""
    __tablename__ = "workflow_template_steps"

    id                     = Column(Integer, primary_key=True, index=True)
    template_id            = Column(Integer, ForeignKey("workflow_templates.id", ondelete="CASCADE"), nullable=False)
    title                  = Column(String(255), nullable=False)
    description            = Column(Text, nullable=True)
    step_order             = Column(Integer, nullable=False)          # ترتيب الخطوة
    is_parallel            = Column(Boolean, default=False)           # True = يشتغل بالتوازي مع نفس الـ order
    assigned_department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    assigned_user_id       = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at             = Column(DateTime, server_default=func.now(), nullable=False)
    deleted_at             = Column(DateTime, nullable=True)  # Soft delete

    # العلاقات
    template            = relationship("WorkflowTemplate", back_populates="steps")
    assigned_department = relationship("Department", foreign_keys=[assigned_department_id])
    assigned_user       = relationship("User", foreign_keys=[assigned_user_id])
