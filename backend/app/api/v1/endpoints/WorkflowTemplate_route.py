# app/api/v1/endpoints/WorkflowTemplate_route.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.User import User
from app.schemas.WorkflowTemplate_schema import (
    WorkflowTemplateCreate,
    WorkflowTemplateOut,
    WorkflowTemplateSummary,
    WorkflowTemplateUpdate,
    TemplateDiagramResponse,
    TemplateDiagramUpdate,
)
from app.services.WorkflowTemplateService import WorkflowTemplateService

router = APIRouter(prefix="/workflow/templates", tags=["Workflow Templates"])

# ─── Endpoints الموجودة سابقاً ────────────────────────────────────

@router.post("/", response_model=WorkflowTemplateOut)
async def create_template(
    data: WorkflowTemplateCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await WorkflowTemplateService.create_template(db, data, user)


@router.get("/", response_model=list[WorkflowTemplateSummary])
async def list_templates(db: AsyncSession = Depends(get_db)):
    return await WorkflowTemplateService.list_templates(db)


@router.patch("/{template_id}", response_model=WorkflowTemplateOut)
async def update_template(
    template_id: int,
    data: WorkflowTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await WorkflowTemplateService.update_template(db, template_id, data, user)


@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await WorkflowTemplateService.delete_template(db, template_id, user)


@router.patch("/{template_id}/toggle", response_model=WorkflowTemplateOut)
async def toggle_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return await WorkflowTemplateService.toggle_template(db, template_id, user)


# ══════════════════════════════════════════════════════════════════
# 🆕 المهمة 5.1: Endpoints للـ Diagram الخاصة بالقوالب
# ══════════════════════════════════════════════════════════════════

@router.get("/{template_id}/diagram", response_model=TemplateDiagramResponse)
async def get_template_diagram(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    جلب قالب Workflow بصيغة ReactFlow (Nodes + Edges) لعرضه كـ رسم بياني.
    """
    template = await WorkflowTemplateService.get_template(db, template_id)
    return WorkflowTemplateService.build_diagram(template)


@router.put("/{template_id}/diagram", response_model=TemplateDiagramResponse)
async def update_template_diagram(
    template_id: int,
    diagram_data: TemplateDiagramUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    تحديث قالب Workflow بالكامل بناءً على تعديلات المستخدم في ReactFlow.
    - يستقبل Nodes و Edges جديدة.
    - يقوم بحذف وإعادة إنشاء الخطوات.
    - يُرجع الـ Diagram المحدث بعد الحفظ.
    """
    # 1. التأكد من وجود القالب
    template = await WorkflowTemplateService.get_template(db, template_id)

    # 2. تنفيذ التحديث
    updated_template = await WorkflowTemplateService.update_template_from_diagram(
        db=db,
        template_id=template_id,
        diagram_data=diagram_data,
        current_user=current_user,
    )

    # 3. حفظ التغييرات
    await db.commit()

    # 4. إعادة الـ Diagram المحدث
    return WorkflowTemplateService.build_diagram(updated_template)