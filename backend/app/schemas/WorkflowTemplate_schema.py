# app/schemas/WorkflowTemplate_schema.py
from __future__ import annotations
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, model_validator, Field

from .WorkflowTemplateStep_schema import TemplateStepCreate, TemplateStepOut
# استيراد الـ schemas الخاصة بالـ Diagram من الملف الذي أنشأناه سابقاً
from .workflow_diagram import (
    WorkflowNodeSchema,
    WorkflowEdgeSchema,
    WorkflowDiagramResponse,  # نعيد استخدامه مع بعض التعديلات
)

# ─── الكود الموجود سابقاً ─────────────────────────────────────────

class WorkflowTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    steps: List[TemplateStepCreate]


class WorkflowTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class WorkflowTemplateOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_active: bool
    created_by: Optional[int]
    created_at: datetime
    steps: List[TemplateStepOut] = []

    model_config = {"from_attributes": True}


class WorkflowTemplateSummary(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_active: bool
    created_by: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════════
# 🆕 المهمة 5.1: Schemas للـ Diagram الخاصة بالقوالب
# ══════════════════════════════════════════════════════════════════

class TemplateDiagramResponse(BaseModel):
    """
    استجابة الرسم البياني للقالب (مشابهة لـ WorkflowDiagramResponse ولكن بدون workflow_id/task_id)
    """
    template_id: int
    name: str
    description: Optional[str]
    is_active: bool
    nodes: List[WorkflowNodeSchema] = Field(default_factory=list)
    edges: List[WorkflowEdgeSchema] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class TemplateDiagramUpdate(BaseModel):
    """
    بيانات تحديث القالب من الرسم البياني (يستقبل nodes و edges من ReactFlow)
    """
    nodes: List[WorkflowNodeSchema]
    edges: List[WorkflowEdgeSchema]

    # التحقق من عدم تكرار الـ IDs
    @model_validator(mode="after")
    def validate_unique_ids(self):
        node_ids = [node.id for node in self.nodes]
        if len(node_ids) != len(set(node_ids)):
            raise ValueError("يوجد تكرار في IDs العقد (يجب أن تكون فريدة)")
        return self

<<<<<<< HEAD
    model_config = {"from_attributes": True}

# ══════════════════════════════════════════════════════════════════
# 🆕 Schemas استخراج القالب كـ خطوات للمهام (as-steps)
# ══════════════════════════════════════════════════════════════════

class TemplateStepImportOut(BaseModel):
    """
    بيانات الخطوة المستخرجة من القالب والمجهزة للعرض في الواجهة أو الاستيراد
    """
    temp_id: str = Field(..., description="معرف مؤقت للخطوة لاستخدامه في ربط العلاقات محلياً")
    title: str
    description: Optional[str] = None
    step_order: int
    is_parallel: bool = False
    assigned_department_id: Optional[int] = None
    assigned_user_id: Optional[int] = None
    
    # 🆕 حقول الأسماء لإثراء بيانات المسؤول في الواجهة
    assignee_name: Optional[str] = None
    department_name: Optional[str] = None
    
    parent_temp_id: Optional[str] = Field(None, description="المعرف المؤقت للخطوة الأب إن وجد")

=======
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    model_config = {"from_attributes": True}