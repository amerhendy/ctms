# app/services/WorkflowTemplateService.py
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
<<<<<<< HEAD
from datetime import datetime
from sqlalchemy.orm import selectinload
from sqlalchemy import select
=======
from sqlalchemy import delete
from datetime import datetime

>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
from app.models.WorkflowTemplateModel import WorkflowTemplate
from app.models.WorkflowTemplateStepModel import WorkflowTemplateStep
from app.repositories.WorkflowTemplate_repo import WorkflowTemplateRepository
from app.schemas.WorkflowTemplate_schema import (
    WorkflowTemplateCreate,
    WorkflowTemplateUpdate,
    TemplateDiagramResponse,
    TemplateDiagramUpdate,
<<<<<<< HEAD
    TemplateStepImportOut,
)
from app.schemas.workflow_diagram import (
    WorkflowNodeSchema,
=======
)
from app.schemas.workflow_diagram import (
    WorkflowNodeSchema,
    WorkflowEdgeSchema,
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    NodePositionSchema,
    WorkflowNodeDataSchema,
)
from app.services.access_service import AccessService

<<<<<<< HEAD
=======
# ─── الكود الموجود سابقاً ─────────────────────────────────────────
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172

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
<<<<<<< HEAD
    # 🆕 دوال الـ Diagram الخاصة بالقوالب (مُحدثة مع الفلترة)
=======
    # 🆕 المهمة 5.1: دوال الـ Diagram الخاصة بالقوالب
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    # ══════════════════════════════════════════════════════════════════

    @staticmethod
    def build_diagram(template: WorkflowTemplate) -> TemplateDiagramResponse:
        """
        يحول قالب Workflow إلى رسم بياني (Nodes + Edges).
<<<<<<< HEAD
        تضمن التصفية هنا استبعاد أي خطوة معلمة كـ deleted_at.
=======
        القوالب لا تحتوي على Dependencies، لذلك الـ edges ستكون فارغة.
        لكننا نستخدم step_order و is_parallel لتحديد الترتيب.
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
        """
        if not template:
            raise ValueError("لا يمكن بناء Diagram من قالب فارغ")

        nodes_list = []

<<<<<<< HEAD
        # 🆕 فلترة الخطوات النشطة فقط لضمان عدم بناء عقد للخطوات المحذوفة
        active_steps = [s for s in template.steps if s.deleted_at is None]

        # تجميع الخطوات حسب الـ order
        steps_by_order: dict[int, list] = {}
        for step in active_steps:
=======
        # تجميع الخطوات حسب الـ order
        steps_by_order: dict[int, list] = {}
        for step in template.steps:
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
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
<<<<<<< HEAD
                    status="pending",
=======
                    status="pending",  # القوالب دائماً pending
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
                    step_order=step.step_order,
                    is_parallel=step.is_parallel,
                    assigned_user_id=step.assigned_user_id,
                    assigned_user_name=step.assigned_user.full_name if step.assigned_user else None,
                    assigned_department_id=step.assigned_department_id,
                    assigned_department_name=step.assigned_department.name if step.assigned_department else None,
<<<<<<< HEAD
                    is_editable=True,
=======
                    is_editable=True,   # في القوالب كل الخطوات قابلة للتعديل
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
                    is_completable=False,
                )

                node = WorkflowNodeSchema(
                    id=str(step.id),
                    type="step",
                    position=NodePositionSchema(x=x_position, y=y_position),
                    data=node_data,
                )
                nodes_list.append(node)

<<<<<<< HEAD
=======
        # القوالب لا تحتوي على edges (سيتم إنشاؤها عند تطبيق القالب على مهمة)
        # لكننا سنسمح للمستخدم بإضافة edges في المحرر، وسنخزنها في حقل منفصل
        # أو نستنتجها من step_order (إذا كان step_order متسلسل) لكننا سنتركها فارغة
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
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
<<<<<<< HEAD
        يقوم بتحديث قالب الـ Workflow بناءً على الـ Nodes و Edges المرسلة من ReactFlow.
        - يُحدّث الخطوات الموجودة عند تطابق الـ ID الحقيقي.
        - يُنشئ خطوات جديدة للعقد ذات الـ IDs المؤقتة أو الجديدة.
        - يُنفّذ (Soft Delete) للخطوات المحذوفة من الواجهة.
        """
        # 1. التحقق من الصلاحيات
=======
        يقوم بتحديث القالب بناءً على الـ Nodes و Edges المرسلة من ReactFlow.
        - يُحدّث الخطوات الموجودة (Step Order, Parallel, المسؤولين).
        - يُنشئ خطوات جديدة.
        - يحذف (Soft Delete) الخطوات التي لم تعد موجودة.
        - (ملاحظة: الـ edges تُستخدم لتحديد الترتيب في القالب، لكنها لا تتحول إلى Dependencies)
        """
        # 1. التحقق من الصلاحية
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
        AccessService.require_pm_or_admin(current_user)

        # 2. جلب القالب
        template = await WorkflowTemplateService.get_template(db, template_id)

<<<<<<< HEAD
        # 3. 🆕 خريطة بالخطوات الحالية النشطة فقط المقترنة بـ DB ID (int)
        existing_steps = {step.id: step for step in template.steps if step.deleted_at is None}
        
        # مجموعة لتتبع الـ IDs التي تم التعامل معها في التحديث لتحديد المحذوف لاحقاً
        processed_step_ids = set()

        # 4. معالجة العقد (Nodes) القادمة من الواجهة
        for node in diagram_data.nodes:
            step_data = node.data

            # فحص ما إذا كان node.id يعبر عن ID حقيقي في قاعدة البيانات أم مؤقت
            is_valid_db_id = node.id.isdigit()
            db_step_id = int(node.id) if is_valid_db_id else None

            if db_step_id and db_step_id in existing_steps:
                # ─── تحديث خطوة موجودة ───
                step = existing_steps[db_step_id]
=======
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
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
                step.title = step_data.label
                step.description = step_data.description or None
                step.step_order = step_data.step_order
                step.is_parallel = step_data.is_parallel
                step.assigned_user_id = step_data.assigned_user_id
                step.assigned_department_id = step_data.assigned_department_id
<<<<<<< HEAD
                
                processed_step_ids.add(db_step_id)
                db.add(step)
            else:
                # ─── إنشاء خطوة جديدة ───
=======
                db.add(step)
            else:
                # إنشاء خطوة جديدة
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
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
<<<<<<< HEAD

        # 5. تنفيذ (Soft Delete) للخطوات التي تم حذفها من الـ Diagram
        for step_id, step in existing_steps.items():
            if step_id not in processed_step_ids:
                step.deleted_at = datetime.utcnow()
                db.add(step)

        # 6. تنفيذ وتحديث الكيان
        await db.flush()
        
        # 🆕 إعادة جلب القالب من الـ Repository لضمان تحميل قائمة steps المفلترة بدون المحذوفات
        updated_template = await WorkflowTemplateRepository.get_by_id(db, template_id)
        return updated_template

    # ══════════════════════════════════════════════════════════════════
    # 🆕 دالة تحويل القالب إلى خطوات خطية (as-steps)
    # ══════════════════════════════════════════════════════════════════

    @staticmethod
    async def get_template_as_steps(db: AsyncSession, template_id: int) -> list[TemplateStepImportOut]:
        """
        جلب خطوات القالب مع تضمين علاقات المستخدم والقسم المنضمين
        """
        # جلب القالب مع عمل load مسبق للعلاقات الخاصة بالخطوات والمسؤولين
        stmt = (
            select(WorkflowTemplate)
            .options(
                selectinload(WorkflowTemplate.steps).selectinload(WorkflowTemplateStep.assigned_user),
                selectinload(WorkflowTemplate.steps).selectinload(WorkflowTemplateStep.assigned_department)
            )
            .where(WorkflowTemplate.id == template_id)
        )
        result = await db.execute(stmt)
        template = result.scalar_one_or_none()

        if not template or not template.steps:
            return []

        imported_steps: list[TemplateStepImportOut] = []
        
        for step in template.steps:
            # استخراج اسم الموظف أو القسم
            assignee_name = None
            if step.assigned_user:
                assignee_name = getattr(step.assigned_user, 'full_name', None) or getattr(step.assigned_user, 'name', None)
                
            department_name = None
            if step.assigned_department:
                department_name = getattr(step.assigned_department, 'name', None)

            imported_steps.append(
                TemplateStepImportOut(
                    temp_id=f"step_tpl_{step.id}",
                    title=step.title,
                    description=step.description,
                    step_order=step.step_order,
                    is_parallel=step.is_parallel,
                    assigned_department_id=step.assigned_department_id,
                    assigned_user_id=step.assigned_user_id,
                    assignee_name=assignee_name,
                    department_name=department_name,
                    parent_temp_id=None
                )
            )

        return imported_steps
=======
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
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
