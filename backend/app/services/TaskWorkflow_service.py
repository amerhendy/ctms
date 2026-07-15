from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select,delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    TaskWorkflow, TaskWorkflowStep
)
from app.models.WorkflowTemplateModel import WorkflowTemplate
from app.models.User import User
from app.models.Task import Task
from app.models.DepartmentManager import DepartmentManager
from app.schemas.TaskWorkflow_schema import WorkflowCreate, WorkflowStepCreate,WorkflowDiagramUpdate
from app.models.TaskWorkflowStepModel import TaskWorkflowStep
from app.models.TaskStepDependency_Model import TaskStepDependency

from app.schemas.TaskWorkflowStep_schema import WorkflowStepUpdate
from app.services.access_service import AccessService, has_delegated_permission
from app.core.utils import logger
from app.db.enums import WorkflowStatus, StepStatus,NotificationType
from app.services.notification_service import NotificationService

from .TaskWorkflowStep_service import TaskWorkflowStepService
from app.repositories.taskWorkFlow_repo import TaskWorkflowRepository as taskWorkFlowRepository
from .task_service import TaskService

from app.schemas.WorkflowTemplate_schema import WorkflowTemplateOut

# ================================================================
# ═════════════════════════════════════════════════════════════════
# 🆕 المهمة 1.3: دوال بناء الـ Diagram (ReactFlow)
# ═════════════════════════════════════════════════════════════════
# ================================================================

from app.schemas.workflow_diagram import (
    WorkflowDiagramResponse,
    WorkflowNodeSchema,
    WorkflowEdgeSchema,
    NodePositionSchema,
    WorkflowNodeDataSchema,
)
from app.repositories.taskWorkFlow_repo import TaskWorkflowRepository

class TaskWorkflowService:
    @staticmethod
    async def get_workflow_by_task_id(
        db: AsyncSession, task_id: int,current_user: User
    ) -> Optional[WorkflowTemplateOut]:
        """جلب الـ workflow لمهمة معينة"""

        task= await TaskService.get_task_or_404(db=db,task_id=task_id)

        return await taskWorkFlowRepository.get_by_task_id(db, task_id)


    @staticmethod
    async def create_workflow(
        db: AsyncSession,
        task_id: int,
        data: WorkflowCreate,
        current_user: User,
    ) -> TaskWorkflow:
        """ينشئ Workflow لمهمة — إما من قالب أو خطوات مخصصة."""
        task= await TaskService.get_task_or_404(db=db,task_id=task_id)
        # تأكد مفيش workflow موجود للمهمة دي
        existing = await taskWorkFlowRepository.get_by_task_id(db,task.id)
        if existing:
            raise HTTPException(status.HTTP_409_CONFLICT,
                                "المهمة عندها Workflow بالفعل")

        # تحقق من الصلاحية — بس منشئ المهمة أو PM/Admin
        if not AccessService.is_pm_or_admin(current_user) and task.created_by != current_user.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN,
                                "بس منشئ المهمة أو المدير يقدر يضيف Workflow")

        steps_data: List[WorkflowStepCreate] = []
        if data.template_id:
            # جلب الخطوات من القالب
            result = await db.execute(
                select(WorkflowTemplate)
                .options(selectinload(WorkflowTemplate.steps))
                .where(WorkflowTemplate.id == data.template_id,
                    WorkflowTemplate.is_active == True)
            )
            template = result.scalar_one_or_none()
            if not template:
                raise HTTPException(status.HTTP_404_NOT_FOUND, "القالب غير موجود أو غير نشط")

            steps_data = [
                WorkflowStepCreate(
                    title=s.title,
                    description=s.description,
                    step_order=s.step_order,
                    is_parallel=s.is_parallel,
                    assigned_department_id=s.assigned_department_id,
                    assigned_user_id=s.assigned_user_id,
                )
                for s in template.steps
            ]
        else:
            steps_data = data.steps
        # إنشاء الـ Workflow
        workflow = TaskWorkflow(
            task_id=task.id,
            template_id=data.template_id,
            status=WorkflowStatus.PENDING,
            created_by=current_user.id,
        )
        db.add(workflow)
        await db.flush()
        # إضافة الخطوات
        for s in steps_data:
            step=await TaskWorkflowStepService.create_step(
                db=db,
                workflow_id=workflow.id,
                step_data=s,
                current_user=current_user,  
            )
        await db.flush()
        await db.refresh(workflow, ["steps"])
        # ابدأ الخطوة (أو الخطوات المتوازية) الأولى
        await TaskWorkflowStepService._activate_next_steps(db, workflow)
        return workflow


    @staticmethod
    async def _get_workflow_with_steps(
        db: AsyncSession, workflow_id: int
    ) -> TaskWorkflow:
        result = await db.execute(
            select(TaskWorkflow)
            .options(selectinload(TaskWorkflow.steps))
            .where(TaskWorkflow.id == workflow_id)
        )
        workflow = result.scalar_one_or_none()
        if not workflow:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Workflow غير موجود")
        return workflow

    @staticmethod
    async def _notify_workflow_completed(
        db: AsyncSession,
        workflow: TaskWorkflow,
    ) -> None:
        """يبعت إشعار اكتمال الـ workflow لمنشئ المهمة."""

        task = await db.get(Task, workflow.task_id)
        if not workflow.created_by:
            return
 
        try:
            await NotificationService.create(
                db=db,
                user_id=workflow.created_by,
                notification_type=NotificationType.WORKFLOW_COMPLETED,
                title=f"اكتمل الـ Workflow للمهمة: {task.title}",
                body="تم إنهاء جميع خطوات الـ Workflow بنجاح.",
                related_task_id=task.id,
            )
        except Exception as e:
            logger.warning(f"فشل إرسال إشعار اكتمال Workflow: {e}")

    @staticmethod
    async def get_workflow_or_404(db: AsyncSession, workflow_id: int) -> TaskWorkflow:
        result = await db.execute(
            select(TaskWorkflow).where(TaskWorkflow.id == workflow_id)
        )
        workflow = result.scalar_one_or_none()
        if not workflow:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Workflow غير موجود")
        return workflow

    # ──────────────────────────────────────────────────────────────
    # 1️⃣ بناء الرسم البياني (Diagram Builder)
    # ──────────────────────────────────────────────────────────────
    @staticmethod
    def build_diagram(workflow: TaskWorkflow) -> WorkflowDiagramResponse:
        """
        يحول كائن Workflow إلى هيكل ReactFlow (Nodes + Edges).
        - يوزع الخطوات أفقياً حسب step_order.
        - يدعم التوازي (نفس الـ order) بتوزيع رأسي.
        """
        if not workflow:
            raise ValueError("لا يمكن بناء Diagram من Workflow فارغ")

        # 1. تجهيز القوائم
        nodes_list = []
        edges_list = []
        
        # 2. تجميع الخطوات حسب الـ order (للتعامل مع التوازي)
        steps_by_order: dict[int, list] = {}
        for step in workflow.steps:
            order = step.step_order
            if order not in steps_by_order:
                steps_by_order[order] = []
            steps_by_order[order].append(step)

        # 3. بناء العقد (Nodes) مع حساب الإحداثيات
        #    - X تعتمد على الـ order (المسافة الأفقية)
        #    - Y تعتمد على ترتيب الخطوة داخل نفس الـ order (المسافة الرأسية للتوازي)
        for order, steps_in_order in steps_by_order.items():
            x_position = order * 250  # مسافة أفقية 250 بكسل بين كل order
            
            for idx, step in enumerate(steps_in_order):
                y_position = idx * 120  # مسافة رأسية 120 بكسل بين الخطوات المتوازية

                # بناء بيانات العقدة
                node_data = WorkflowNodeDataSchema(
                    label=step.title,
                    description=step.description,
                    status=step.status,
                    step_order=step.step_order,
                    is_parallel=step.is_parallel,
                    assigned_user_id=step.assigned_user_id,
                    assigned_user_name=step.assigned_user.full_name if step.assigned_user else None,
                    assigned_department_id=step.assigned_department_id,
                    assigned_department_name=step.assigned_department.name if step.assigned_department else None,
                    started_at=step.started_at,
                    completed_at=step.completed_at,
                    # صلاحيات مؤقتة (سيتم تحديدها لاحقاً في الـ Service أو الـ Frontend)
                    is_editable=(step.status == StepStatus.PENDING),
                    is_completable=(step.status == StepStatus.IN_PROGRESS),
                )

                # بناء العقدة نفسها
                node = WorkflowNodeSchema(
                    id=str(step.id),  # ReactFlow يحتاج ID نصي
                    type="step",      # هذا النوع سيرتبط بـ CustomNode في الفرونت
                    position=NodePositionSchema(x=x_position, y=y_position),
                    data=node_data,
                )
                nodes_list.append(node)

        # 4. بناء الحواف (Edges) من الـ Dependencies
        #    - نجمع كل الـ Dependencies من جميع الخطوات
        all_dependencies = []
        for step in workflow.steps:
            if step.dependencies:
                all_dependencies.extend(step.dependencies)

        for dep in all_dependencies:
            # جلب حالة الخطوة الأب (source) عشان نحدد لون العلاقة
            parent_step = next((s for s in workflow.steps if s.id == dep.parent_step_id), None)
            child_step = next((s for s in workflow.steps if s.id == dep.child_step_id), None)
            
            edge_status = child_step.status if child_step else StepStatus.PENDING
            
            edge = WorkflowEdgeSchema(
                id=f"{dep.parent_step_id}-{dep.child_step_id}",
                source=str(dep.parent_step_id),
                target=str(dep.child_step_id),
                type="animated",  # ← نفس النوع
                animated=False,
                data={
                    "status": edge_status.value if hasattr(edge_status, 'value') else str(edge_status),
                    "label": f"← {parent_step.title if parent_step else 'خطوة سابقة'}",
                }
            )
            edges_list.append(edge)


        # 5. إرجاع الـ Response النهائي
        return WorkflowDiagramResponse(
            workflow_id=workflow.id,
            task_id=workflow.task_id,
            workflow_status=workflow.status,
            nodes=nodes_list,
            edges=edges_list,
        )

    # ──────────────────────────────────────────────────────────────
    # 2️⃣ جلب الرسم البياني من قاعدة البيانات
    # ──────────────────────────────────────────────────────────────
    @staticmethod
    async def get_workflow_diagram(
        db: AsyncSession,
        task_id: int,
        current_user: User,
    ) -> WorkflowDiagramResponse:
        """
        دالة الخدمة التي تُستخدم في الـ Endpoint لجلب الـ Diagram.
        - تجلب الـ Workflow مع Steps و Dependencies من الـ Repository.
        - تحوله إلى Diagram باستخدام build_diagram.
        """
        # 1. جلب الـ Workflow بالكامل (مع dependencies بفضل التعديل في 1.2)
        workflow = await TaskWorkflowRepository.get_by_task_id(db, task_id)
        
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="لا يوجد Workflow لهذه المهمة"
            )

        # (اختياري) التحقق من صلاحية المستخدم في رؤية المهمة
        # يمكن إضافتها حسب منطق مشروعك، لكنها غير مطلوبة للـ Diagram حالياً
        # task = await TaskService.get_task_or_404(db, task_id)
        # if not AccessService.can_view_task(current_user, task):
        #     raise HTTPException(403, "ليس لديك صلاحية لعرض هذا الـ Workflow")

        # 2. بناء وإرجاع الـ Diagram
        return TaskWorkflowService.build_diagram(workflow)


        # ──────────────────────────────────────────────────────────────
    # 2️⃣ تحديث الـ Workflow من Diagram (المهمة 2.2)
    # ──────────────────────────────────────────────────────────────
    @staticmethod
    async def update_workflow_from_diagrams(
        db: AsyncSession,
        workflow_id: int,
        diagram_data: WorkflowDiagramUpdate,
        current_user: User,
    ) -> TaskWorkflow:
        """
        يقوم بتحديث الـ Workflow بناءً على الـ Nodes و Edges المرسلة من ReactFlow.
        - يُحدّث الخطوات الموجودة (Step Order, Parallel, المسؤولين).
        - يُنشئ خطوات جديدة إذا وُجدت IDs غير موجودة في قاعدة البيانات.
        - يحذف (Soft Delete) الخطوات التي لم تعد موجودة في الـ Nodes.
        - يحذف جميع الـ Dependencies القديمة ويعيد إنشائها من الـ Edges الجديدة.
        """
        # 1. التحقق من الصلاحية
        workflow = await TaskWorkflowService.get_workflow_or_404(db, workflow_id)
        task = await db.get(Task, workflow.task_id)
        
        if not AccessService.is_pm_or_admin(current_user) and task.created_by != current_user.id:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "ليس لديك صلاحية لتعديل هذا الـ Workflow"
            )
        
        
        # 2. منع تعديل Workflow مكتمل أو ملغي
        if workflow.status in [WorkflowStatus.COMPLETED, WorkflowStatus.CANCELLED]:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "لا يمكن تعديل Workflow بعد اكتماله أو إلغائه"
            )

        # 3. جلب الخطوات الحالية (للمقارنة)
        existing_steps = {str(step.id): step for step in workflow.steps}
        new_step_ids = {node.id for node in diagram_data.nodes}
        id_mapping = {}

        
        # 4. معالجة الخطوات (Nodes)
        for node in diagram_data.nodes:
            step_id = int(node.id)
            step_data = node.data

            if step_id in existing_steps:
                # ✅ تحديث خطوة موجودة
                step = existing_steps[step_id]
                step.title = step_data.label
                step.description = step_data.description or None
                step.step_order = step_data.step_order
                step.is_parallel = step_data.is_parallel
                step.assigned_user_id = step_data.assigned_user_id
                step.assigned_department_id = step_data.assigned_department_id
                # لا نغير الحالة (status) هنا لأنها تدار بواسطة Endpoint منفصل (complete_step)
                db.add(step)
                id_mapping[node.id] = step_id
            else:
                # 🆕 إنشاء خطوة جديدة (إذا أضافها المستخدم في المحرر)
                new_step = TaskWorkflowStep(
                    workflow_id=workflow.id,
                    title=step_data.label,
                    description=step_data.description or None,
                    step_order=step_data.step_order,
                    is_parallel=step_data.is_parallel,
                    assigned_user_id=step_data.assigned_user_id,
                    assigned_department_id=step_data.assigned_department_id,
                    status=StepStatus.PENDING,  # الخطوات الجديدة تبدأ معلقة
                    version=1,
                )
                db.add(new_step)
                await db.flush()
                # إضافتها للـ map عشان نتعامل معها لو ظهرت في الـ Edges
                existing_steps[str(new_step.id)] = new_step
                id_mapping[node.id] = new_step.id

        # 5. حذف الخطوات التي لم تعد موجودة في الـ Nodes (Soft Delete)
        for step_id_str, step in existing_steps.items():
            if step_id_str not in new_step_ids:
                step.deleted_at = datetime.utcnow()
                db.add(step)

        # 6. Flush عشان نضمن أن جميع الخطوات الجديدة أخذت IDs
        await db.flush()

        # 7. معالجة الـ Dependencies (Edges)
        #    - حذف جميع الـ Dependencies القديمة للـ Workflow
        stmt_delete = delete(TaskStepDependency).where(
            TaskStepDependency.child_step_id.in_(
                [step.id for step in workflow.steps if step.deleted_at is None]
            )
        )
        # لكن الطريقة الأكثر أماناً: جلب الـ Dependencies الحالية وحذفها يدوياً
        for step in workflow.steps:
            if step.deleted_at is None:
                # حذف الـ dependencies المرتبطة بهذه الخطوة
                await db.execute(
                    delete(TaskStepDependency).where(
                        TaskStepDependency.child_step_id == step.id
                    )
                )

        # 8. إنشاء الـ Dependencies الجديدة من الـ Edges
        for edge in diagram_data.edges:
            source_id_str = edge.source
            target_id_str = edge.target

            # استخدام الخريطة للحصول على الـ ID الفعلي
            actual_source_id = id_mapping.get(source_id_str)
            actual_target_id = id_mapping.get(target_id_str)

            # لو مش موجود في الخريطة (ممكن يكون ID قديم ولم يتغير)
            if actual_source_id is None:
                actual_source_id = int(source_id_str) if source_id_str.isdigit() else None
            if actual_target_id is None:
                actual_target_id = int(target_id_str) if target_id_str.isdigit() else None

            # التأكد من وجود المصدر والهدف الفعليين في existing_steps
            source_step = existing_steps.get(str(actual_source_id))
            target_step = existing_steps.get(str(actual_target_id))

            if not source_step or source_step.deleted_at is not None:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    f"الخطوة المصدر {source_id_str} غير موجودة أو محذوفة"
                )
            if not target_step or target_step.deleted_at is not None:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    f"الخطوة الهدف {target_id_str} غير موجودة أو محذوفة"
                )

            # منع الاعتماد على النفس
            if actual_source_id == actual_target_id:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    "لا يمكن للخطوة أن تعتمد على نفسها"
                )

            # إنشاء الاعتمادية الجديدة
            new_dep = TaskStepDependency(
                parent_step_id=actual_source_id,
                child_step_id=actual_target_id,
            )
            db.add(new_dep)


        # 9. تحديث حالة الـ Workflow إلى "in_progress" إذا كان فيه خطوات نشطة
        #    وإلا يظل pending
        has_pending = any(
            s.status == StepStatus.PENDING and s.deleted_at is None
            for s in workflow.steps
        )
        has_in_progress = any(
            s.status == StepStatus.IN_PROGRESS and s.deleted_at is None
            for s in workflow.steps
        )

        if has_in_progress:
            workflow.status = WorkflowStatus.IN_PROGRESS
        elif has_pending and not has_in_progress:
            workflow.status = WorkflowStatus.PENDING
        else:
            # كل الخطوات إما مكتملة أو محذوفة
            all_completed = all(
                s.status == StepStatus.COMPLETED or s.deleted_at is not None
                for s in workflow.steps
            )
            workflow.status = WorkflowStatus.COMPLETED if all_completed else WorkflowStatus.PENDING

        db.add(workflow)

        # 10. حفظ جميع التغييرات
        await db.flush()
        await db.refresh(workflow, ["steps"])

        return workflow

    @staticmethod
    async def _validate_workflow_for_update(
        db: AsyncSession,
        workflow_id: int,
        current_user: User
    ) -> tuple[TaskWorkflow, Task]:
        """
        تتحقق من وجود الـ Workflow والمهمة، ومن صلاحية المستخدم، وحالة الـ Workflow.
        تُرجع (workflow, task) إذا كان كل شيء صحيحاً.
        """
        workflow = await TaskWorkflowService.get_workflow_or_404(db, workflow_id)
        task = await db.get(Task, workflow.task_id)
        
        if not AccessService.is_pm_or_admin(current_user) and task.created_by != current_user.id:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "ليس لديك صلاحية لتعديل هذا الـ Workflow"
            )
        if workflow.status in [WorkflowStatus.COMPLETED, WorkflowStatus.CANCELLED]:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "لا يمكن تعديل Workflow بعد اكتماله أو إلغائه"
            )
        
        return workflow, task
    
    @staticmethod
    async def _process_nodes(
        db: AsyncSession,
        workflow: TaskWorkflow,
        nodes: List[WorkflowNodeSchema],
    ) -> tuple[dict[str, TaskWorkflowStep], dict[str, int]]:
        """
        معالجة العقد (Nodes) القادمة من الـ Diagram:
        - تحديث الخطوات الموجودة.
        - إنشاء خطوات جديدة.
        - إرجاع:
          - existing_steps: dict {str(step.id): step} لكل الخطوات (بما فيها الجديدة).
          - id_mapping: dict {node.id: actual_step_id} لربط الـ IDs المرسلة بالـ IDs الفعلية.
        """
        await db.refresh(workflow, ["steps"])
        existing_steps = {int(step.id): step for step in workflow.steps}
        id_mapping = {}

        for node in nodes:
            step_id = int(node.id)
            step_data = node.data
            if step_id in existing_steps:
                step = existing_steps[step_id]
                step.title = step_data.label
                step.description = step_data.description or None
                step.step_order = step_data.step_order
                step.is_parallel = step_data.is_parallel
                step.assigned_user_id = step_data.assigned_user_id
                step.assigned_department_id = step_data.assigned_department_id
                db.add(step)
                id_mapping[node.id] = step_id
            else:
                new_step = TaskWorkflowStep(
                    workflow_id=workflow.id,
                    title=step_data.label,
                    description=step_data.description or None,
                    step_order=step_data.step_order,
                    is_parallel=step_data.is_parallel,
                    assigned_user_id=step_data.assigned_user_id,
                    assigned_department_id=step_data.assigned_department_id,
                    status=StepStatus.PENDING,
                    version=1,
                )
                db.add(new_step)
                await db.flush()
                existing_steps[int(new_step.id)] = new_step
                id_mapping[node.id] = new_step.id
        return existing_steps, id_mapping

    @staticmethod
    async def _soft_delete_missing_steps(
        db: AsyncSession,
        existing_steps: dict[int, TaskWorkflowStep],
        new_step_ids: set[int],
    ):
        """
        تحذف (Soft Delete) الخطوات الموجودة في existing_steps ولكن غير موجودة في new_step_ids.
        """
        for step_id_str, step in existing_steps.items():
            if step_id_str not in new_step_ids:
                step.deleted_at = datetime.utcnow()
                db.add(step)
        await db.flush()

    @staticmethod
    async def _clear_old_dependencies(db: AsyncSession, workflow: TaskWorkflow):
        """
        تحذف جميع الـ Dependencies القديمة المرتبطة بخطوات الـ Workflow.
        """
        for step in workflow.steps:
            if step.deleted_at is None:
                await db.execute(
                    delete(TaskStepDependency).where(
                        TaskStepDependency.child_step_id == step.id
                    )
                )

    @staticmethod
    async def _process_edges(
        db: AsyncSession,
        edges: List[WorkflowEdgeSchema],
        existing_steps: dict[int, TaskWorkflowStep],
        id_mapping: dict[str, int],
    ):
        """
        تُنشئ Dependencies جديدة من الـ Edges بعد التحقق من:
        - وجود المصدر والهدف فعلياً (باستخدام id_mapping).
        - عدم وجود دورة (يمكن إضافة تحقق اختياري هنا).
        - منع الاعتماد على النفس.
        """
        # التحقق من وجود دورة
        edge_tuples = [(edge.source, edge.target) for edge in edges]
        if TaskWorkflowService.detect_cycle_in_edges(edge_tuples):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "الرسم البياني يحتوي على دورة"
            )

        for edge in edges:
            source_id_str = edge.source
            target_id_str = edge.target

            actual_source_id = id_mapping.get(source_id_str)
            actual_target_id = id_mapping.get(target_id_str)

            if actual_source_id is None:
                actual_source_id = int(source_id_str) if source_id_str.isdigit() else None
            if actual_target_id is None:
                actual_target_id = int(target_id_str) if target_id_str.isdigit() else None

            source_step = existing_steps.get(actual_source_id)
            target_step = existing_steps.get(actual_target_id)

            if not source_step or source_step.deleted_at is None:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    f"الخطوة المصدر {source_id_str} غير موجودة أو محذوفة"
                )
            if not target_step or target_step.deleted_at is None:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    f"الخطوة الهدف {target_id_str} غير موجودة أو محذوفة"
                )

            if actual_source_id == actual_target_id:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    "لا يمكن للخطوة أن تعتمد على نفسها"
                )

            new_dep = TaskStepDependency(
                parent_step_id=actual_source_id,
                child_step_id=actual_target_id,
            )
            db.add(new_dep)
    @staticmethod
    async def _update_workflow_status(db: AsyncSession, workflow: TaskWorkflow):
        """
        تحديث حالة الـ Workflow بناءً على حالة خطواته.
        """
        has_pending = any(
            s.status == StepStatus.PENDING and s.deleted_at is None
            for s in workflow.steps
        )
        has_in_progress = any(
            s.status == StepStatus.IN_PROGRESS and s.deleted_at is None
            for s in workflow.steps
        )

        if has_in_progress:
            workflow.status = WorkflowStatus.IN_PROGRESS
        elif has_pending and not has_in_progress:
            workflow.status = WorkflowStatus.PENDING
        else:
            all_completed = all(
                s.status == StepStatus.COMPLETED or s.deleted_at is not None
                for s in workflow.steps
            )
            workflow.status = WorkflowStatus.COMPLETED if all_completed else WorkflowStatus.PENDING

        db.add(workflow)

    @staticmethod
    async def update_workflow_from_diagram(
        db: AsyncSession,
        task_id: int,
        diagram_data: WorkflowDiagramUpdate,
        current_user: User,
    ) -> WorkflowDiagramResponse:
        """
        الدالة الرئيسية: تقوم بتحديث الـ Workflow بالكامل من الـ Diagram.
        """
        # 1. جلب الـ Workflow المرتبط بهذه المهمة
        workflow = await TaskWorkflowService.get_workflow_by_task_id(db, task_id, current_user)
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="لا يوجد Workflow لهذه المهمة لتحديثه"
            )
        workflow_id = workflow.id
        # 1. التحقق من الصلاحية والحالة
        workflow, task = await TaskWorkflowService._validate_workflow_for_update(
            db, workflow_id, current_user
        )

        # 2. معالجة العقد (Nodes)
        existing_steps, id_mapping = await TaskWorkflowService._process_nodes(
            db, workflow, diagram_data.nodes
        )
        # 3. حذف الخطوات المفقودة
        new_step_ids = {node.id for node in diagram_data.nodes}
        await TaskWorkflowService._soft_delete_missing_steps(
            db, existing_steps, new_step_ids
        )

        # 4. مسح الـ Dependencies القديمة
        await TaskWorkflowService._clear_old_dependencies(db, workflow)

        # 5. إنشاء الـ Dependencies الجديدة من الـ Edges
        await TaskWorkflowService._process_edges(
            db, diagram_data.edges, existing_steps, id_mapping
        )

        # 6. تحديث حالة الـ Workflow
        await TaskWorkflowService._update_workflow_status(db, workflow)

        # 7. حفظ التغييرات
        await db.flush()
        await db.refresh(workflow, ["steps"])
        await db.commit()
        return await TaskWorkflowService.get_workflow_diagram(db, task_id, current_user)

    @staticmethod
    def detect_cycle_in_edges(edges: List[tuple[int, int]]) -> bool:
        """
        تتحقق من وجود دورة في قائمة الحواف (parent, child).
        تستخدم DFS.
        """
        # بناء جدول الجوار
        graph = {}
        for parent, child in edges:
            graph.setdefault(parent, []).append(child)

        visited = set()
        rec_stack = set()

        def dfs(node):
            visited.add(node)
            rec_stack.add(node)
            for neighbor in graph.get(node, []):
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            rec_stack.remove(node)
            return False

        for node in graph:
            if node not in visited:
                if dfs(node):
                    return True
        return False
