# app/services/WorkflowTemplateService.py
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from datetime import datetime

from app.models.WorkflowTemplateModel import WorkflowTemplate
from app.models.WorkflowTemplateStepModel import WorkflowTemplateStep
from app.repositories.WorkflowTemplate_repo import WorkflowTemplateRepository
from app.schemas.WorkflowTemplate_schema import (
    WorkflowTemplateCreate,
    WorkflowTemplateUpdate,
    TemplateDiagramResponse,
    TemplateDiagramUpdate,
)
from app.schemas.workflow_diagram import (
    WorkflowNodeSchema,
    WorkflowEdgeSchema,
    NodePositionSchema,
    WorkflowNodeDataSchema,
)
from app.services.access_service import AccessService

# ─── الكود الموجود سابقاً ─────────────────────────────────────────

class WorkflowTemplateService:

    @staticmethod
    async def create_template(db: AsyncSession, data: WorkflowTemplateCreate, current_user):
        AccessService.require_pm_or_admin(current_user)
        existing = await WorkflowTemplateRepository.get_by_name(db, data.name)
        if existing:
            raise HTTPException(status_code=400, detail="يوجد قالب بهذا الاسم بالفعل")
        template_data = data.model_dump(exclude={'steps'})
        template_data['created_by'] = current_user.id
        templateData = await WorkflowTemplateRepository.create(db, template_data)
        template = await WorkflowTemplateRepository.get_by_id(db, templateData.id)
        return template

    @staticmethod
    async def get_template(db: AsyncSession, template_id: int):
        template = await WorkflowTemplateRepository.get_by_id(db, template_id)
        if not template:
            raise HTTPException(status_code=404, detail="القالب غير موجود")
        return template

    @staticmethod
    async def update_template(db: AsyncSession, template_id: int, data: WorkflowTemplateUpdate, current_user):
        AccessService.require_pm_or_admin(current_user)
        template = await WorkflowTemplateService.get_template(db, template_id)
        updated_template = await WorkflowTemplateRepository.update(db, template, data)
        await db.commit()
        return updated_template

    @staticmethod
    async def list_templates(db: AsyncSession):
        return await WorkflowTemplateRepository.list_all(db)

    @staticmethod
    async def delete_template(db: AsyncSession, template_id: int, current_user):
        AccessService.require_pm_or_admin(current_user)
        template = await WorkflowTemplateService.get_template(db, template_id)
        await WorkflowTemplateRepository.delete(db, template)
        await db.commit()
        return {"detail": "تم حذف القالب بنجاح"}

    @staticmethod
    async def toggle_template(db: AsyncSession, template_id: int, current_user):
        AccessService.require_pm_or_admin(current_user)
        template = await WorkflowTemplateService.get_template(db, template_id)
        toggled = await WorkflowTemplateRepository.toggle_active(db, template)
        await db.commit()
        return toggled

    # ══════════════════════════════════════════════════════════════════
    # 🆕 المهمة 5.1: دوال الـ Diagram الخاصة بالقوالب
    # ══════════════════════════════════════════════════════════════════

    @staticmethod
    def build_diagram(template: WorkflowTemplate) -> TemplateDiagramResponse:
        """
        يحول قالب Workflow إلى رسم بياني (Nodes + Edges).
        القوالب لا تحتوي على Dependencies، لذلك الـ edges ستكون فارغة.
        لكننا نستخدم step_order و is_parallel لتحديد الترتيب.
        """
        if not template:
            raise ValueError("لا يمكن بناء Diagram من قالب فارغ")

        nodes_list = []

        # تجميع الخطوات حسب الـ order
        steps_by_order: dict[int, list] = {}
        for step in template.steps:
            order = step.step_order
            if order not in steps_by_order:
                steps_by_order[order] = []
            steps_by_order[order].append(step)

        # بناء العقد مع حساب الإحداثيات
        for order, steps_in_order in steps_by_order.items():
            x_position = order * 250  # مسافة أفقية

            for idx, step in enumerate(steps_in_order):
                y_position = idx * 120  # مسافة رأسية للتوازي

                node_data = WorkflowNodeDataSchema(
                    label=step.title,
                    description=step.description,
                    status="pending",  # القوالب دائماً pending
                    step_order=step.step_order,
                    is_parallel=step.is_parallel,
                    assigned_user_id=step.assigned_user_id,
                    assigned_user_name=step.assigned_user.full_name if step.assigned_user else None,
                    assigned_department_id=step.assigned_department_id,
                    assigned_department_name=step.assigned_department.name if step.assigned_department else None,
                    is_editable=True,   # في القوالب كل الخطوات قابلة للتعديل
                    is_completable=False,
                )

                node = WorkflowNodeSchema(
                    id=str(step.id),
                    type="step",
                    position=NodePositionSchema(x=x_position, y=y_position),
                    data=node_data,
                )
                nodes_list.append(node)

        # القوالب لا تحتوي على edges (سيتم إنشاؤها عند تطبيق القالب على مهمة)
        # لكننا سنسمح للمستخدم بإضافة edges في المحرر، وسنخزنها في حقل منفصل
        # أو نستنتجها من step_order (إذا كان step_order متسلسل) لكننا سنتركها فارغة
        edges_list = []

        return TemplateDiagramResponse(
            template_id=template.id,
            name=template.name,
            description=template.description,
            is_active=template.is_active,
            nodes=nodes_list,
            edges=edges_list,
        )

    @staticmethod
    async def update_template_from_diagram(
        db: AsyncSession,
        template_id: int,
        diagram_data: TemplateDiagramUpdate,
        current_user,
    ) -> WorkflowTemplate:
        """
        يقوم بتحديث القالب بناءً على الـ Nodes و Edges المرسلة من ReactFlow.
        - يُحدّث الخطوات الموجودة (Step Order, Parallel, المسؤولين).
        - يُنشئ خطوات جديدة.
        - يحذف (Soft Delete) الخطوات التي لم تعد موجودة.
        - (ملاحظة: الـ edges تُستخدم لتحديد الترتيب في القالب، لكنها لا تتحول إلى Dependencies)
        """
        # 1. التحقق من الصلاحية
        AccessService.require_pm_or_admin(current_user)

        # 2. جلب القالب
        template = await WorkflowTemplateService.get_template(db, template_id)

        # 3. جلب الخطوات الحالية
        existing_steps = {str(step.id): step for step in template.steps}
        new_step_ids = {node.id for node in diagram_data.nodes}

        # 4. معالجة الخطوات (Nodes)
        for node in diagram_data.nodes:
            step_id = int(node.id)
            step_data = node.data

            if step_id in existing_steps:
                # تحديث خطوة موجودة
                step = existing_steps[step_id]
                step.title = step_data.label
                step.description = step_data.description or None
                step.step_order = step_data.step_order
                step.is_parallel = step_data.is_parallel
                step.assigned_user_id = step_data.assigned_user_id
                step.assigned_department_id = step_data.assigned_department_id
                db.add(step)
            else:
                # إنشاء خطوة جديدة
                new_step = WorkflowTemplateStep(
                    template_id=template.id,
                    title=step_data.label,
                    description=step_data.description or None,
                    step_order=step_data.step_order,
                    is_parallel=step_data.is_parallel,
                    assigned_user_id=step_data.assigned_user_id,
                    assigned_department_id=step_data.assigned_department_id,
                )
                db.add(new_step)
                existing_steps[str(new_step.id)] = new_step

        # 5. حذف الخطوات التي لم تعد موجودة (Soft Delete)
        for step_id_str, step in existing_steps.items():
            if step_id_str not in new_step_ids:
                step.deleted_at = datetime.utcnow()
                db.add(step)

        # 6. حفظ التغييرات
        await db.flush()
        await db.refresh(template, ["steps"])

        # 7. (اختياري) يمكن تخزين الـ edges في حقل منفصل إذا أردت
        # ولكننا سنستنتج الترتيب من step_order

        return template