# app/services/TaskWorkflowStep_service.py
"""
خدمة الـ Workflow للمهام.
تتحكم في:
  - إنشاء Workflow (من قالب أو مخصص)
  - تقدم الخطوات (sequential / parallel)
  - إرسال الإشعارات عند بدء / إنهاء كل خطوة
  - التحقق من صلاحية إنهاء الخطوة
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    TaskWorkflow, TaskWorkflowStep
)
from app.models.WorkflowTemplateModel import WorkflowTemplate
from app.models.User import User
from app.models.Task import Task
from app.models.DepartmentManager import DepartmentManager

from app.schemas.TaskWorkflow_schema import WorkflowCreate, WorkflowStepCreate
from app.schemas.TaskWorkflowStep_schema import WorkflowStepUpdate,WorkflowStepOut

from app.repositories.TaskWorkflowStep_repo import TaskWorkflowStepRepository

from app.services.notification_service import NotificationService
from app.services.access_service import AccessService, has_delegated_permission
from app.db.enums import WorkflowStatus, StepStatus,NotificationType
from app.core.utils import logger
class TaskWorkflowStepService:
    @staticmethod
    async def complete_step(
        db: AsyncSession,
        step_id: int,
        notes: Optional[str],
        current_user: User,
    ) -> WorkflowStepOut:
        """يُنهي خطوة ويفعّل الخطوة التالية."""
        #check if step exists
        step= await TaskWorkflowStepRepository.get_step_by_id(db,step_id)
        if not step:
            raise HTTPException(status.HTTP_404_NOT_FOUND,
                                "الخطوة مش موجودة")

        if step.status != StepStatus.IN_PROGRESS:
            raise HTTPException(status.HTTP_400_BAD_REQUEST,
                                "الخطوة مش في حالة تنفيذ — لا يمكن إنهاؤها الآن")
        
        # تحقق من صلاحية الإنهاء
        await TaskWorkflowStepService._require_complete_permission(db, step, current_user)
        if step.assigned_user_id != current_user.id:
            # يمكنك رفع خطأ 403 Forbidden لأن المستخدم ليس لديه صلاحية
            raise HTTPException(
                status_code=403, 
                detail="ليس لديك صلاحية لتنفيذ هذه الخطوة. هي مسندة لمستخدم آخر."
            )

        # 3. التحقق من أن جميع الأباء قد اكتملوا (المنطق السابق)
        if not await TaskWorkflowStepService.are_all_parents_completed(db, step_id):
            raise HTTPException(400, "لا يمكن إتمام الخطوة، الاعتماديات لم تكتمل بعد.")

        step.status       = StepStatus.COMPLETED
        step.notes        = notes
        step.completed_by = current_user.id
        step.completed_at = datetime.utcnow()
        db.add(step)
        await db.flush()

        # جلب الـ workflow
        from app.services.TaskWorkflow_service import TaskWorkflowService
        workflow = await TaskWorkflowService._get_workflow_with_steps(db, step.workflow_id)
        print(step)
        return step

        # هل كل خطوات نفس الـ order خلصت？
        same_order_steps = [s for s in workflow.steps if s.step_order == step.step_order]
        all_done = all(s.status == StepStatus.COMPLETED for s in same_order_steps)

        if all_done:
            activated = await TaskWorkflowStepService._activate_next_steps(db, workflow)
            if not activated:
                # مفيش خطوات تانية — الـ workflow خلص
                workflow.status = WorkflowStatus.COMPLETED
                db.add(workflow)

                # إشعار اكتمال الـ workflow
                await TaskWorkflowService._notify_workflow_completed(db, workflow)

        return step
    

    @staticmethod
    async def update_step(
        db: AsyncSession,
        step: TaskWorkflowStep,
        data: WorkflowStepUpdate,
        current_user: User,
    ) -> TaskWorkflowStep:
        from app.services.TaskWorkflow_service import TaskWorkflowService
        workflow = await TaskWorkflowService._get_workflow_with_steps(db, step.workflow_id)
        task = await db.get(Task, workflow.task_id)

        if not AccessService.is_pm_or_admin(current_user) and task.created_by != current_user.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN,
                                "بس منشئ المهمة أو المدير يقدر يعدل الخطوات")

        if step.status != StepStatus.PENDING:
            raise HTTPException(status.HTTP_400_BAD_REQUEST,
                                "لا يمكن تعديل خطوة بدأت أو انتهت")

        for field, value in data.model_dump(exclude_none=True).items():
            setattr(step, field, value)

        db.add(step)
        return step
    
    @staticmethod
    async def delete_step(
        db: AsyncSession,
        step: TaskWorkflowStep,
        current_user: User,
    ) -> None:
        from app.services.TaskWorkflow_service import TaskWorkflowService
        workflow = await TaskWorkflowService._get_workflow_with_steps(db, step.workflow_id)
        task = await db.get(Task, workflow.task_id)

        if not AccessService.is_pm_or_admin(current_user) and task.created_by != current_user.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN,
                                "بس منشئ المهمة أو المدير يقدر يحذف الخطوات")

        if step.status != StepStatus.PENDING:
            raise HTTPException(status.HTTP_400_BAD_REQUEST,
                                "لا يمكن حذف خطوة بدأت أو انتهت")

        await db.delete(step)
    
    @staticmethod
    async def get_step_by_id(
        db: AsyncSession, step_id: int
    ) -> Optional[TaskWorkflowStep]:
        result = await db.execute(
            select(TaskWorkflowStep)
            .options(
                selectinload(TaskWorkflowStep.assigned_department),
                selectinload(TaskWorkflowStep.assigned_user),
            )
            .where(TaskWorkflowStep.id == step_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def _activate_next_steps(
        db: AsyncSession, workflow: TaskWorkflow
    ) -> bool:
        """
        يفعّل الخطوة (أو الخطوات المتوازية) التالية في الـ workflow.
        يُرجع True لو في خطوات اتفعلت، False لو الـ workflow خلص.
        """
        
        # الخطوات اللسه pending مرتبة بالـ order
        pending = sorted(
            [s for s in workflow.steps if s.status == StepStatus.PENDING],
            key=lambda s: s.step_order
        )
        logger.debug(pending)
        return 
        if not pending:
            return False

        next_order = pending[0].step_order

        # كل الخطوات اللي ليها نفس الـ order (parallel group)
        next_group = [s for s in pending if s.step_order == next_order]

        for step in next_group:
            step.status     = StepStatus.IN_PROGRESS
            step.started_at = datetime.utcnow()
            db.add(step)

        await db.flush()

        # إشعار لكل خطوة اتفعلت
        for step in next_group:
            await TaskWorkflowStepService._notify_step_started(db, workflow, step)

        return True


    @staticmethod
    async def _require_complete_permission(
        db: AsyncSession,
        step: WorkflowStepOut,
        user: User,
    ) -> None:
        """
        يتحقق أن المستخدم يملك صلاحية إنهاء الخطوة.
        المسموح لهم:
        ١. منشئ المهمة
        ٢. PM / Admin
        ٣. الموظف المعين على الخطوة
        ٤. مدير الإدارة المعينة على الخطوة
        ٥. من معه تفويض على الإدارة دي
        """
        if AccessService.is_pm_or_admin(user):
            return

        # جلب المهمة للتحقق من المنشئ
        workflow = await db.get(TaskWorkflow, step.workflow_id)
        task = await db.get(Task, workflow.task_id)
        if task.created_by == user.id:
            return

        # الموظف المعين مباشرة
        if step.assigned_user_id == user.id:
            return

        # مدير الإدارة المعينة
        if step.assigned_department_id:
            result = await db.execute(
                select(DepartmentManager).where(
                    DepartmentManager.department_id == step.assigned_department_id,
                    DepartmentManager.user_id == user.id,
                    DepartmentManager.deleted_at.is_(None),
                )
            )
            if result.scalar_one_or_none():
                return

            # تفويض
            if await has_delegated_permission(db, user.id, step.assigned_department_id, "complete_step"):
                return

        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "لا تملك صلاحية إنهاء هذه الخطوة"
        )
    
    @staticmethod
    async def _notify_step_started(
        db: AsyncSession,
        workflow: TaskWorkflow,
        step: TaskWorkflowStep,
    ) -> None:
        """
        يبعت إشعار لـ:
        - الموظف المعين على الخطوة (لو موجود)
        - مديري الإدارة المعينة (لو موجودة)
        - منشئ المهمة دائماً
        """

        task = await db.get(Task, workflow.task_id)
        recipient_ids: set[int] = set()

        # منشئ المهمة
        if workflow.created_by:
            recipient_ids.add(workflow.created_by)

        # الموظف المعين
        if step.assigned_user_id:
            recipient_ids.add(step.assigned_user_id)

        # مديري الإدارة المعينة
        if step.assigned_department_id:
            result = await db.execute(
                select(DepartmentManager.user_id).where(
                    DepartmentManager.department_id == step.assigned_department_id,
                    DepartmentManager.deleted_at.is_(None),
                )
            )
            for row in result.fetchall():
                recipient_ids.add(row[0])

        for uid in recipient_ids:
            try:
                await NotificationService.create(
                    db=db,
                    user_id=uid,
                    notification_type=NotificationType.WORKFLOW_STEP_STARTED,
                    title=f"خطوة جديدة تحتاج تنفيذك: {step.title}",
                    body=f"المهمة: {task.title}\nالخطوة: {step.title}",
                    related_task_id=task.id,
                )
            except Exception as e:
                logger.warning(f"فشل إرسال إشعار بدء الخطوة للمستخدم {uid}: {e}")

    @staticmethod
    async def create_step(
        db: AsyncSession,
        workflow_id: int,
        step_data: WorkflowStepCreate,
        current_user: User,
    ):
        """ينشئ خطوة جديدة في الـ workflow."""
        from app.services.TaskWorkflow_service import TaskWorkflowService
        from backend.app.repositories.TaskStepDependency_repo import TaskWorkflowStepDependencyRepository
        workflow = await TaskWorkflowService.get_workflow_or_404(db, workflow_id)
        step_payload = step_data.model_dump(exclude={'parent_step_ids'})
        step_payload["workflow_id"] = workflow.id
        step_payload["status"] = "pending"
        step_payload["version"] = 1
        new_step = await TaskWorkflowStepRepository.create(db, step_payload)
        if step_data.parent_step_ids:
            for parent_id in step_data.parent_step_ids:
                # التأكد أن الـ Parent ينتمي لنفس الـ Workflow (اختياري للسلامة)
                await TaskWorkflowStepDependencyRepository.create_dependency(
                    db, 
                    child_step_id=new_step.id, 
                    parent_step_id=parent_id
                )
        
        await db.commit()
        await db.refresh(new_step)
        return new_step

    @staticmethod
    async def validate_no_circular_dependency(db: AsyncSession, child_id: int, parent_id: int):
        """
        تتأكد من أن parent_id لا يعتمد بشكل غير مباشر على child_id،
        مما يمنع حدوث دائرة مغلقة (Circular Dependency).
        """
        # إذا كان الخطوة هي نفسها الأب (حالة بديهية)
        if child_id == parent_id:
            raise HTTPException(400, "لا يمكن للخطوة أن تعتمد على نفسها")

        # 1. جلب كل الـ Ancestors (الأجداد) الخاصين بالـ parent_id
        # نحتاج دالة في الـ Repository تجلب سلسلة الاعتماديات كاملة
        from backend.app.repositories.TaskStepDependency_repo import TaskWorkflowStepDependencyRepository
        visited = await TaskWorkflowStepDependencyRepository.get_all_ancestors(db, parent_id)
        
        # 2. إذا كان child_id موجوداً ضمن الأجداد، فهذا يعني وجود دائرة
        if child_id in visited:
            raise HTTPException(400, "هذا الربط يسبب دائرة مغلقة (Circular Dependency)")

        return True
    
    @staticmethod
    async def add_dependency_to_step(db: AsyncSession, child_step_id: int, parent_step_id: int):
        # 1. التحقق من عدم وجود دائرة مغلقة
        await TaskWorkflowStepService.validate_no_circular_dependency(db, child_step_id, parent_step_id)
        
        # 2. إذا مر التحقق بنجاح، نقوم بإنشاء الاعتمادية
        from backend.app.repositories.TaskStepDependency_repo import TaskWorkflowStepDependencyRepository
        return await TaskWorkflowStepDependencyRepository.create_dependency(
            db, 
            child_step_id=child_step_id, 
            parent_step_id=parent_step_id
        )
    
    @staticmethod
    async def complete_step(db: AsyncSession, step_id: int, current_user: User):
        # 1. جلب الخطوة
        step = await TaskWorkflowStepRepository.get_step_by_id(db, step_id)
        if not step:
            raise HTTPException(404, "الخطوة غير موجودة")

        # 2. التحقق من أن جميع الأباء قد اكتملوا
        # نجلب كل الـ IDs للخطوات الأب
        from backend.app.repositories.TaskStepDependency_repo import TaskWorkflowStepDependencyRepository
        parent_ids = await TaskWorkflowStepDependencyRepository.get_parent_step_ids(db, step_id)
        
        for parent_id in parent_ids:
            parent_step = await TaskWorkflowStepRepository.get_step_by_id(db, parent_id)
            if parent_step.status != "completed":
                raise HTTPException(
                    400, 
                    f"لا يمكن إتمام الخطوة، الخطوة السابقة '{parent_step.title}' لم تكتمل بعد"
                )

        # 3. تحديث حالة الخطوة الحالية
        step.status = "completed"
        await NotificationService.trigger_next_steps_notifications(db, step.workflow_id)
        # ممكن إضافة تاريخ الانتهاء أو المستخدم المنفذ هنا
        await db.flush()
        await db.commit()
        
        return step
    
    @staticmethod
    async def are_all_parents_completed(db: AsyncSession, step_id: int) -> bool:
        """تتأكد من أن جميع الأباء (Dependencies) قد تم إنهاؤهم."""
        # جلب الـ parent_ids
        from backend.app.repositories.TaskStepDependency_repo import TaskWorkflowStepDependencyRepository
        parent_ids = await TaskWorkflowStepDependencyRepository.get_parent_step_ids(db, step_id)
        
        for p_id in parent_ids:
            parent_step = await TaskWorkflowStepRepository.get_step_by_id(db, p_id)
            if not parent_step or parent_step.status != "completed":
                return False
        return True