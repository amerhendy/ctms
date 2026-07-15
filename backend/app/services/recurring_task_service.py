#app/services/recurring_task_service.py
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.schemas.base import apply_pagination
from app.core.utils import  get_utc_now_naive,get_utc_now
from app.db.enums import GlobalRole

from app.models.RecurringTask import RecurringTask
from app.models.RecurringTaskLog import RecurringTaskLog
from app.models.User import User
from app.repositories.recurring_task_repo import RecurringTaskRepository
from app.services.log_service import LogService
from app.core.permissions import can_manage_recurring_template, can_view_recurring_template
from app.services.access_service import AccessService
from app.services.automation import execute_recurring_tasks_automation
class RecurringTaskService:
    @staticmethod
    async def create_template(db: AsyncSession, current_user: User, data: dict):
        # 1. التحقق من الصلاحيات
        is_admin = current_user.global_role in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER)
        is_dept_manager = (
            current_user.department_id == data.get("department_id") and
            getattr(current_user, 'is_department_manager', False)
        )
        
        if not (is_admin or is_dept_manager):
            raise HTTPException(403, "غير مصرح لك بإنشاء قالب مهمة متكررة في هذا القسم")

        # 2. معالجة البيانات
        data["created_by"] = current_user.id
        if "next_run_date" in data and isinstance(data["next_run_date"], str):
            data["next_run_date"] = datetime.strptime(data["next_run_date"], "%Y-%m-%d").date()

        # 3. الحفظ عبر الـ Repository
        template = await RecurringTaskRepository.create(db, data)
        
        # 4. توثيق العملية
        await LogService.log_action(db, None, current_user.id, "recurring_template_created", new_value=data.get("title"))
        
        await db.commit()
        return {"id": template.id, "message": "تم حفظ قالب المهمة المتكررة بنجاح"}

    @staticmethod
    async def delete_template(db, user, template_id):
        template = await RecurringTaskRepository.get_by_id(db, template_id)
        if not template:
            raise HTTPException(404, "القالب غير موجود")
        
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
        # 1. التحقق من الصلاحيات (Admin Only)
        if not AccessService.is_pm_or_admin(current_user):
            raise HTTPException(403, "غير مصرح لك بتنفيذ هذا الإجراء")

        # 2. تنفيذ المحرك
        summary = await execute_recurring_tasks_automation(db)
        
        # 3. توثيق العملية (Log)
        # await LogService.log_action(db, None, current_user.id, "manual_automation_triggered", new_value=str(summary))
        
        return summary