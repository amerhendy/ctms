<<<<<<< HEAD
# app/models/WorkflowTemplateModel.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship, foreign
=======
# app/models/WorkflowTemplate.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
from sqlalchemy.sql import func
from app.db.session import Base


class WorkflowTemplate(Base):
    """قالب Workflow جاهز يمكن تطبيقه على أي مهمة"""
    __tablename__ = "workflow_templates"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active   = Column(Boolean, default=True, nullable=False)
    created_by  = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at  = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at  = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at  = Column(DateTime, nullable=True)

    # العلاقات
<<<<<<< HEAD
    # 🆕 تم تعديل primaryjoin لتصفية الخطوات المحذوفة (Soft Delete) تلقائياً
    steps   = relationship(
        "WorkflowTemplateStep",
        primaryjoin="and_(WorkflowTemplate.id == foreign(WorkflowTemplateStep.template_id), WorkflowTemplateStep.deleted_at.is_(None))",
        back_populates="template",
        order_by="WorkflowTemplateStep.step_order",
        cascade="all, delete-orphan",
    )
    creator = relationship("User", foreign_keys=[created_by])
=======
    steps   = relationship("WorkflowTemplateStep", back_populates="template",
                           order_by="WorkflowTemplateStep.step_order",
                           cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])


>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
