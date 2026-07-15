from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.TaskWorkflowModel import TaskWorkflow
from app.models.TaskWorkflowStepModel import TaskWorkflowStep
from app.models.TaskStepDependency_Model import TaskStepDependency
from app.models.User import User


class TaskWorkflowRepository:
    @staticmethod
    def base_query():
        """استعلام أساسي لاسترجاع الـ Workflows الغير محذوفة"""
        return select(TaskWorkflow).where(TaskWorkflow.deleted_at.is_(None))

    @staticmethod
    async def create(db, data):
        """إنشاء Workflow جديد"""
        workflow = TaskWorkflow(**data)
        db.add(workflow)
        await db.flush()
        return workflow

    @staticmethod
    async def get_with_steps(db, workflow_id: int):
        """جلب Workflow محدد مع خطواته (بدون تحميل التبعيات)"""
        stmt = TaskWorkflowRepository.base_query().where(
            TaskWorkflow.id == workflow_id
        ).options(selectinload(TaskWorkflow.steps))
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_task_id(db, task_id: int):
        """
        ✅ (معدّل) جلب Workflow الخاص بمهمة معينة مع:
        - الخطوات (Steps)
        - المستخدم المعين على كل خطوة وجهات الاتصال الخاصة به
        - الإدارة المعينة على كل خطوة
        - اعتماديات (Dependencies) كل خطوة (لتحويلها لـ Edges في ReactFlow)
        """
        stmt = TaskWorkflowRepository.base_query().options(
            selectinload(TaskWorkflow.steps).options(
                selectinload(TaskWorkflowStep.assigned_user).selectinload(User.contacts),
                selectinload(TaskWorkflowStep.assigned_department),
                selectinload(TaskWorkflowStep.dependencies)  # <--- الإضافة الجديدة هنا
            )
        ).where(
            TaskWorkflow.task_id == task_id
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_diagram_data(db, task_id: int):
        """
        ✅ (جديد) دالة مخصصة لجلب كل البيانات المطلوبة لبناء الرسم البياني (Diagram).
        تختلف عن get_by_task_id في أنها تحمل أيضاً الـ Parent Step داخل الـ Dependency
        عشان نعرض الأب في الـ Frontend بسهولة (مثلاً لعرض اسم الأب عند الـ Hover).
        """
        stmt = TaskWorkflowRepository.base_query().where(
            TaskWorkflow.task_id == task_id
        ).options(
            selectinload(TaskWorkflow.steps).options(
                selectinload(TaskWorkflowStep.assigned_user),
                selectinload(TaskWorkflowStep.assigned_department),
                selectinload(TaskWorkflowStep.dependencies).selectinload(
                    TaskStepDependency.parent_step
                )  # تحميل الأب (الخطوة السابقة) ككامل عشان نعرض اسمها
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()