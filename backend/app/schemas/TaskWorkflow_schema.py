# app/schemas/TaskWorkflow_schema.py
from __future__ import annotations
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, model_validator,Field

# ─── استيراد الأنواع الخاصة بالـ Workflow Steps ──────────────
from .TaskWorkflowStep_schema import WorkflowStepCreate, WorkflowStepOut

# ─── استيراد الأنواع الخاصة بالـ ReactFlow Diagram ──────────
# (التي أنشأناها في المهمة 1.1)
from .workflow_diagram import (
    WorkflowNodeSchema,
    WorkflowEdgeSchema,
)

# ─── استيراد الـ Enums ──────────────────────────────────────────
from app.db.enums import WorkflowStatus, StepStatus


# ══════════════════════════════════════════════════════════════════
# 📌 الأكواد الموجودة سابقاً (لم يتم تغييرها)
# ══════════════════════════════════════════════════════════════════

class WorkflowCreate(BaseModel):
    """إنشاء workflow لمهمة — إما من قالب أو من خطوات مخصصة"""
    template_id: Optional[int] = None
    steps: Optional[List[WorkflowStepCreate]] = None

    @model_validator(mode="after")
    def template_or_steps(self):
        if not self.template_id and not self.steps:
            raise ValueError("لازم تحدد إما template_id أو steps")
        if self.template_id and self.steps:
            raise ValueError("حدد إما template_id أو steps — مش الاتنين مع بعض")
        return self


class WorkflowOut(BaseModel):
    """استجابة الـ Workflow (الطريقة التقليدية)"""
    id: int
    task_id: int
    template_id: Optional[int]
    status: WorkflowStatus
    created_by: Optional[int]
    created_at: datetime
    steps: List[WorkflowStepOut] = []

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════════
# 🆕 المهمة 2.1: إضافة Schema لتحديث الـ Diagram
# ══════════════════════════════════════════════════════════════════

class WorkflowDiagramUpdate(BaseModel):
    """
    🆕 يُستخدم في Endpoint: PUT /workflow/{task_id}/diagram
    يستقبل من Frontend البيانات الجديدة للـ Nodes و Edges بعد تعديل المستخدم
    (سحب وإفلات، إضافة خطوات، ربط جديد بين الخطوات).
    """
    nodes: List[WorkflowNodeSchema] = Field(
        ..., 
        description="قائمة العقد (الخطوات) مع إحداثياتها وبياناتها الجديدة"
    )
    edges: List[WorkflowEdgeSchema] = Field(
        ..., 
        description="قائمة الحواف (العلاقات) التي تحدد أي خطوة تسبق الأخرى"
    )

    # (اختياري) يمكن إضافة Validator للتأكد من عدم وجود تكرار في الـ IDs
    @model_validator(mode="after")
    def validate_unique_ids(self):
        node_ids = [node.id for node in self.nodes]
        if len(node_ids) != len(set(node_ids)):
            raise ValueError("يوجد تكرار في IDs العقد (يجب أن تكون فريدة)")
        return self

    model_config = {"from_attributes": True}