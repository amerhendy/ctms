# app/schemas/workflow_diagram.py
from __future__ import annotations
from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel, Field

# سنستخدم نفس الـ Enums الموجودة في المشروع
from app.db.enums import StepStatus, WorkflowStatus


# ─── ١. إحداثيات العقدة (Node Position) ──────────────────────────
class NodePositionSchema(BaseModel):
    """إحداثيات (x, y) للعقدة داخل لوحة ReactFlow"""
    x: float
    y: float

    model_config = {"from_attributes": True}


# ─── ٢. البيانات الداخلية للعقدة (Node Data) ────────────────────
class WorkflowNodeDataSchema(BaseModel):
    """
    البيانات التي ستظهر داخل العقدة وكيفية تعامل الـ Frontend معها.
    تطابق الـ props اللي هتتبعت لـ CustomNode في React.
    """
    label: str = Field(..., description="العنوان الرئيسي المعروض على العقدة")
    description: Optional[str] = Field(None, description="وصف مختصر للخطوة")
    
    # معلومات الحالة
    status: StepStatus = Field(default=StepStatus.PENDING)
    step_order: int = Field(..., description="ترتيب الخطوة (يستخدم لتحديد المتوازي)")
    is_parallel: bool = Field(default=False, description="هل هذه الخطوة متوازية مع التي تسبقها؟")
    
    # المسؤولية
    assigned_user_id: Optional[int] = None
    assigned_user_name: Optional[str] = Field(None, description="اسم الموظف لعرضه سريعاً")
    assigned_department_id: Optional[int] = None
    assigned_department_name: Optional[str] = Field(None, description="اسم الإدارة لعرضه سريعاً")
    
    # التواقيت
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # هل يمكن التعديل أو الإنهاء حالياً (يُحسب في الباك اند قبل الإرسال)
    is_editable: bool = Field(default=False)
    is_completable: bool = Field(default=False)

    model_config = {"from_attributes": True}


# ─── ٣. العقدة الكاملة (Node) كما يطلبها ReactFlow ──────────────
class WorkflowNodeSchema(BaseModel):
    """
    هيكل العقدة المطابق تماماً لـ ReactFlow (React Flow uses 'id', 'type', 'position', 'data').
    """
    id: str = Field(..., description="يجب أن يكون نفس ID الخطوة من قاعدة البيانات ولكن محول إلى String")
    type: str = Field(default="step", description="نوع العقدة (لتحديد الـ Custom Node في الفرونت)")
    position: NodePositionSchema
    data: WorkflowNodeDataSchema

    model_config = {"from_attributes": True}


# ─── ٤. الحافة (Edge) كما يطلبها ReactFlow ──────────────────────
class WorkflowEdgeSchema(BaseModel):
    """
    هيكل الحافة المطابق لـ ReactFlow (تربط بين عقدتين).
    """
    id: str = Field(..., description="عادة تكون 'source-target'")
    source: str = Field(..., description="ID العقدة الأب (السابقة)")
    target: str = Field(..., description="ID العقدة الابن (التالية)")
    type: str = Field(default="smoothstep", description="نوع الخط (smoothstep, straight, step)")
    animated: bool = Field(default=False, description="تفعيل حركة السهم في الواجهة")

    model_config = {"from_attributes": True}


# ─── ٥. المخطط الرئيسي (Response) ─────────────────────────────────
class WorkflowDiagramResponse(BaseModel):
    """
    الـ Response الرئيسي الذي سترجعه الـ API لعرض الـ Workflow.
    """
    workflow_id: int
    task_id: int
    workflow_status: WorkflowStatus
    nodes: List[WorkflowNodeSchema] = Field(default_factory=list)
    edges: List[WorkflowEdgeSchema] = Field(default_factory=list)

    model_config = {"from_attributes": True}


# ─── ٦. مخطط التحديث (Request) عندما يرسل الفرونت التعديلات ──────
class WorkflowDiagramUpdate(BaseModel):
    """
    الـ Body الذي سيستقبله الباك اند عندما يقوم المستخدم بسحب العقد أو تغيير الروابط.
    سيتم استخدامه في Endpoint الخاص بـ PUT /{task_id}/diagram
    """
    nodes: List[WorkflowNodeSchema]
    edges: List[WorkflowEdgeSchema]

    # يمكن إضافة validation للتأكد من عدم وجود تكرار أو دوائر مغلقة على مستوى الـ Pydantic
    # لكننا سنتركها للـ Service (لأنها تحتاج DB)