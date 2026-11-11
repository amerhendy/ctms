#app/services/recurring_task_service.py
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
<<<<<<< HEAD
from sqlalchemy import select

=======
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
from datetime import datetime
from app.schemas.base import apply_pagination
from app.core.utils import  get_utc_now_naive,get_utc_now
from app.db.enums import GlobalRole

<<<<<<< HEAD
from app.models.RecurringTaskModel import RecurringTask
from app.models.RecurringTaskLog import RecurringTaskLog
from app.models.RecurringTaskModel import RecurringTaskStep
from app.models.User import User
from app.models.Department import Department
from app.repositories.recurring_task_repo import RecurringTaskRepository
from app.repositories.department_repository import DepartmentRepository
=======
from app.models.RecurringTask import RecurringTask
from app.models.RecurringTaskLog import RecurringTaskLog
from app.models.User import User
from app.repositories.recurring_task_repo import RecurringTaskRepository
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
from app.services.log_service import LogService
from app.core.permissions import can_manage_recurring_template, can_view_recurring_template
from app.services.access_service import AccessService
from app.services.automation import execute_recurring_tasks_automation
<<<<<<< HEAD

from app.core.utils import logger
class RecurringTaskService:
    @staticmethod
    async def create_template(db: AsyncSession, current_user: User, data: dict):
        if not data.get("department_id"):
            raise HTTPException(403, "من فضلك اختر القسم")
            
        dept = await DepartmentRepository.get_by_id(db, data["department_id"], include_relations=True)
        if not dept:
            raise HTTPException(404, "الإدارة غير موجودة")

=======
class RecurringTaskService:
    @staticmethod
    async def create_template(db: AsyncSession, current_user: User, data: dict):
        # 1. التحقق من الصلاحيات
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
        is_admin = current_user.global_role in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER)
        is_dept_manager = (
            current_user.department_id == data.get("department_id") and
            getattr(current_user, 'is_department_manager', False)
        )
        
        if not (is_admin or is_dept_manager):
            raise HTTPException(403, "غير مصرح لك بإنشاء قالب مهمة متكررة في هذا القسم")

<<<<<<< HEAD
        # التحقق المستبق من وجود كيانات الخطوات الممررة
        if "steps" in data and data["steps"]:
            await RecurringTaskService._validate_steps_entities(db, data["steps"])

=======
        # 2. معالجة البيانات
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
        data["created_by"] = current_user.id
        if "next_run_date" in data and isinstance(data["next_run_date"], str):
            data["next_run_date"] = datetime.strptime(data["next_run_date"], "%Y-%m-%d").date()

<<<<<<< HEAD
        template = await RecurringTaskRepository.create(db, data)
        await LogService.log_action(db, None, current_user.id, "recurring_template_created", new_value=data.get("title"))
        await db.commit()
        return {"id": template.id, "message": "تم حفظ قالب المهمة المتكررة مع كافة خطواته بنجاح"}

    @staticmethod
    async def update_template(db: AsyncSession, current_user: User, template_id: int, payload):
        template = await RecurringTaskRepository.get_by_id(db, template_id)
        if not template:
            raise HTTPException(404, "القالب غير موجود")

        if not can_manage_recurring_template(current_user, template):
            raise HTTPException(403, "غير مصرح لك بتعديل هذا القالب")

        update_data = payload.model_dump(exclude_unset=True)
        
        # معالجة الـ Diff Update للخطوات إذا تم إرسال حقل steps
        if "steps" in update_data:
            steps_payload = update_data.pop("steps")
            if steps_payload is not None:
                await RecurringTaskService._apply_steps_diff(db, template, steps_payload)

        if "next_run_date" in update_data and isinstance(update_data["next_run_date"], str):
            update_data["next_run_date"] = datetime.strptime(update_data["next_run_date"], "%Y-%m-%d").date()

        updated_template = await RecurringTaskRepository.update(db, template, update_data)
        await LogService.log_action(db, None, current_user.id, "recurring_template_updated", new_value=updated_template.title)
        return {"message": "تم تحديث بيانات القالب وخطواته بنجاح"}

    @staticmethod
    async def _apply_steps_diff(db: AsyncSession, template: RecurringTask, steps_payload: list):
        """دالة مساعدة لمعالجة التحديث الجزئي (Diff Update) لخطوات القالب مع التحقق المستبق"""
        
        # التحقق المستبق من صحة الأقسام والمستخدمين الممررين في الـ Payload
        await RecurringTaskService._validate_steps_entities(db, steps_payload)

        existing_steps_map = {step.id: step for step in template.steps if step.deleted_at is None}
        payload_step_ids = {s["id"] for s in steps_payload if s.get("id") is not None}
        now_utc = get_utc_now()

        # 1. الحذف الناعم للخطوات غير الموجودة في الـ Payload
        for step_id, step_obj in existing_steps_map.items():
            if step_id not in payload_step_ids:
                step_obj.deleted_at = now_utc

        # 2. التحديث والإضافة
        for step_data in steps_payload:
            step_id = step_data.get("id")
            if step_id and step_id in existing_steps_map:
                # تحديث خطوة موجودة
                step_obj = existing_steps_map[step_id]
                for key, val in step_data.items():
                    if key != "id" and val is not None:
                        setattr(step_obj, key, val)
            elif not step_id:
                # إنشاء خطوة جديدة
                step_data.pop("id", None)
                new_step = RecurringTaskStep(**step_data)
                template.steps.append(new_step)

    @staticmethod
    async def _validate_steps_entities(db: AsyncSession, steps_data: list):
        """دالة مساعدة للتحقق المستبق من وجود الأقسام والمستخدمين المحددين في الخطوات"""
        if not steps_data:
            return

        dept_ids = {s.get("assigned_department_id") for s in steps_data if s.get("assigned_department_id")}
        user_ids = {s.get("assigned_user_id") for s in steps_data if s.get("assigned_user_id")}

        # 1. التحقق من الأقسام
        if dept_ids:
            stmt = select(Department.id).where(Department.id.in_(dept_ids))
            res = await db.execute(stmt)
            existing_dept_ids = set(res.scalars().all())
            missing_depts = dept_ids - existing_dept_ids
            if missing_depts:
                raise HTTPException(
                    status_code=400,
                    detail=f"الأقسام ذات المعرفات التالية غير موجودة في النظام: {list(missing_depts)}"
                )

        # 2. التحقق من المستخدمين
        if user_ids:
            stmt = select(User.id).where(User.id.in_(user_ids))
            res = await db.execute(stmt)
            existing_user_ids = set(res.scalars().all())
            missing_users = user_ids - existing_user_ids
            if missing_users:
                raise HTTPException(
                    status_code=400,
                    detail=f"المستخدمين ذوي المعرفات التالية غير موجودين في النظام: {list(missing_users)}"
                )
        
    @staticmethod
    async def delete_template(db: AsyncSession, current_user: User, template_id: int):
=======
        # 3. الحفظ عبر الـ Repository
        template = await RecurringTaskRepository.create(db, data)
        
        # 4. توثيق العملية
        await LogService.log_action(db, None, current_user.id, "recurring_template_created", new_value=data.get("title"))
        
        await db.commit()
        return {"id": template.id, "message": "تم حفظ قالب المهمة المتكررة بنجاح"}

    @staticmethod
    async def delete_template(db, user, template_id):
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
        template = await RecurringTaskRepository.get_by_id(db, template_id)
        if not template:
            raise HTTPException(404, "القالب غير موجود")
        
<<<<<<< HEAD
        if not can_manage_recurring_template(current_user, template):
            raise HTTPException(403, "غير مصرح لك بحذف هذا القالب")
            
        await RecurringTaskRepository.soft_delete_with_steps(db, template, get_utc_now())
        await LogService.log_action(db, None, current_user.id, "recurring_template_deleted", old_value=template.title)
        return {"message": "تم حذف القالب وخطواته التابعة بنجاح"}

    @staticmethod
    async def restore_template(db: AsyncSession, current_user: User, template_id: int):
        template = await RecurringTaskRepository.get_by_id(db, template_id, include_deleted=True)
        if not template or template.deleted_at is None:
            raise HTTPException(404, "القالب المحذوف غير موجود")

        if not can_manage_recurring_template(current_user, template):
            raise HTTPException(403, "غير مصرح لك باسترجاع هذا القالب")

        await RecurringTaskRepository.restore_with_steps(db, template)
        await LogService.log_action(db, None, current_user.id, "recurring_template_restored", new_value=template.title)
        return {"message": "تم استرجاع القالب وخطواته بنجاح"}

    @staticmethod
    async def get_paginated_templates(db, current_user, page, page_size, search, sort_by, sort_order, include_deleted: bool = False):
        query = RecurringTaskRepository.get_base_query(current_user, include_deleted=include_deleted)
        return await apply_pagination(
            db=db, base_query=query, model_class=RecurringTask,
            page=page, page_size=page_size, search_query=search,
            search_column="title", sort_by=sort_by, sort_order=sort_order
        )
    @staticmethod
    async def get_paginated_deleted_templates(db, current_user, page, page_size, search, sort_by, sort_order, include_deleted: bool = False):
        query = RecurringTaskRepository.get_base_query_trash(current_user)
        return await apply_pagination(
            db=db, base_query=query, model_class=RecurringTask,
            page=page, page_size=page_size, search_query=search,
            search_column="title", sort_by=sort_by, sort_order=sort_order
        )
    @staticmethod
    async def get_paginated_logs(db, page, page_size, search, sort_by, sort_order):
        query = RecurringTaskRepository.get_logs_base_query()
        return await apply_pagination(
            db=db, base_query=query, model_class=RecurringTaskLog,
            page=page, page_size=page_size, search_query=search,
            search_column="status", sort_by=sort_by, sort_order=sort_order
        )

    @staticmethod
    async def get_template_details(db, current_user, template_id: int):
        template = await RecurringTaskRepository.get_by_id(db, template_id)
        if not template:
            raise HTTPException(404, "قالب المهمة المتكررة غير موجود")
        if not can_view_recurring_template(current_user, template):
            raise HTTPException(403, "غير مصرح لك بعرض هذا القالب")
        return template
    
    
=======
        if not can_manage_recurring_template(user, template):
            raise HTTPException(403, "غير مصرح لك")
            
        await RecurringTaskRepository.soft_delete(db, template, get_utc_now())
        await LogService.log_action(db, None, user.id, "recurring_template_deleted", old_value=template.title)
        await db.commit()

    @staticmethod
    async def get_paginated_templates(db, current_user, page, page_size, search, sort_by, sort_order):
        query = RecurringTaskRepository.get_base_query(current_user)
        
        return await apply_pagination(
            db=db,
            base_query=query,
            model_class=RecurringTask,
            page=page,
            page_size=page_size,
            search_query=search,
            search_column="title",
            sort_by=sort_by,
            sort_order=sort_order
        )

    @staticmethod
    async def get_paginated_logs(db, page, page_size, search, sort_by, sort_order):
        query = RecurringTaskRepository.get_logs_base_query()
        
        # ملاحظة: إذا كانت دالة apply_pagination الخاصة بك تتوقع الاستعلام 
        # بـ model_class واحد، قد تحتاج لضبطها لتعمل مع الـ Joins أو 
        # جلب الـ Log فقط والاعتماد على الـ relationship في الموديل.
        return await apply_pagination(
            db=db,
            base_query=query,
            model_class=RecurringTaskLog, 
            page=page,
            page_size=page_size,
            search_query=search,
            search_column="status",
            sort_by=sort_by,
            sort_order=sort_order
        )

    @staticmethod
    async def get_template_details(db, current_user, template_id):
        template = await RecurringTaskRepository.get_by_id(db, template_id)
        
        if not template:
            raise HTTPException(404, "قالب المهمة المتكررة غير موجود")

        if not can_view_recurring_template(current_user, template):
            raise HTTPException(403, "غير مصرح لك بعرض هذا القالب")

        # إرجاع الكائن مباشرة (أو تحويله لـ Schema)
        return template
    
    @staticmethod
    async def update_template(db, current_user, template_id, payload):
        # 1. جلب القالب (مستفيدين من دالة get_active_by_id السابقة)
        template = await RecurringTaskRepository.get_by_id(db, template_id)
        if not template:
            raise HTTPException(404, "القالب غير موجود")

        # 2. التحقق من الصلاحيات (يجب إضافته هنا)
        # if not can_manage_recurring_template(current_user, template):
        #     raise HTTPException(403, "غير مصرح لك بتعديل هذا القالب")

        # 3. معالجة البيانات
        update_data = payload.model_dump(exclude_unset=True)
        if "next_run_date" in update_data and isinstance(update_data["next_run_date"], str):
            update_data["next_run_date"] = datetime.strptime(update_data["next_run_date"], "%Y-%m-%d").date()

        # 4. التحديث
        updated_template = await RecurringTaskRepository.update(db, template, update_data)
        
        # 5. اللوج
        await LogService.log_action(db, None, current_user.id, "recurring_template_updated", new_value=updated_template.title)
        
        return {"message": "تم تحديث كافة بيانات قالب المهام المتكررة بنجاح"}

>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    @staticmethod
    async def delete_templates(db, current_user, template_id):
        # 1. جلب القالب (باستخدام الدالة الموجودة مسبقاً)
        template = await RecurringTaskRepository.get_by_id(db, template_id)
        if not template:
            raise HTTPException(404, "القالب غير موجود")

        # 2. التحقق من الصلاحيات
        if not can_manage_recurring_template(current_user, template):
            raise HTTPException(403, "غير مصرح لك بحذف هذا القالب")

        # 3. الحذف الناعم
        await RecurringTaskRepository.soft_delete(db, template)

        # 4. توثيق العملية (Log)
        await LogService.log_action(db, None, current_user.id, "recurring_template_deleted", old_value=template.title)
        
        return {"message": "تم حذف قالب التكرار بنجاح"}


    @staticmethod
    async def trigger_manual_automation(db, current_user):
<<<<<<< HEAD
        if not AccessService.is_pm_or_admin(current_user):
            raise HTTPException(403, "غير مصرح لك بتنفيذ هذا الإجراء")
        return await execute_recurring_tasks_automation(db)
=======
        # 1. التحقق من الصلاحيات (Admin Only)
        if not AccessService.is_pm_or_admin(current_user):
            raise HTTPException(403, "غير مصرح لك بتنفيذ هذا الإجراء")

        # 2. تنفيذ المحرك
        summary = await execute_recurring_tasks_automation(db)
        
        # 3. توثيق العملية (Log)
        # await LogService.log_action(db, None, current_user.id, "manual_automation_triggered", new_value=str(summary))
        
        return summary
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
