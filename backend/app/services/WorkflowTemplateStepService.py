from typing import List

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.WorkflowTemplateStep_rep import WorkflowTemplateStepRepository
from app.repositories.WorkflowTemplate_repo import WorkflowTemplateRepository
from app.schemas.WorkflowTemplateStep_schema import TemplateStepCreate
from app.services.access_service import AccessService

class WorkflowTemplateStepService:

    @staticmethod
    async def add_step_to_template(db: AsyncSession, template_id: int, data: TemplateStepCreate, current_user):
        # 1. التحقق من الصلاحيات
        AccessService.require_pm_or_admin(current_user)
        
        # 2. التأكد من أن القالب موجود
        template = await WorkflowTemplateRepository.get_by_id(db, template_id)
        if not template:
            raise HTTPException(status_code=404, detail="القالب غير موجود")

        # 3. إنشاء الخطوة
        step_data = data.model_dump()
        step_data["template_id"] = template_id
        return await WorkflowTemplateStepRepository.create(db, step_data)

    @staticmethod
    async def add_multiple_steps(db: AsyncSession, template_id: int, steps: List[TemplateStepCreate], user):
        created_steps = []
        for step_data in steps:
            # تحويل البيانات وإضافة الـ template_id
            step_dict = step_data.model_dump()
            step_dict['template_id'] = template_id
            
            # استدعاء الـ Repository لإضافة خطوة واحدة
            step = await WorkflowTemplateStepRepository.createMultiple(db, step_dict)
            created_steps.append(step)
        
        await db.commit() # الحفظ النهائي لجميع الخطوات
        return created_steps
    
    @staticmethod
    async def get_template_steps(db: AsyncSession, template_id: int):
        return await WorkflowTemplateStepRepository.get_steps_by_template(db, template_id)

    @staticmethod
    async def update_step(db: AsyncSession, step_id: int, data, current_user):
        AccessService.require_pm_or_admin(current_user)
        
        step = await WorkflowTemplateStepRepository.get_step_by_id(db, step_id)
        if not step:
            raise HTTPException(status_code=404, detail="الخطوة غير موجودة")
        
        updated_step = await WorkflowTemplateStepRepository.update(db, step, data)
        return updated_step

    @staticmethod
    async def delete_step(db: AsyncSession, step_id: int, current_user):
        AccessService.require_pm_or_admin(current_user)
        
        step = await WorkflowTemplateStepRepository.get_step_by_id(db, step_id)
        if not step:
            raise HTTPException(status_code=404, detail="الخطوة غير موجودة")
            
        await WorkflowTemplateStepRepository.delete(db, step)
        return {"detail": "تم حذف الخطوة بنجاح"}

    @staticmethod
    async def reorder_steps(db: AsyncSession, template_id: int, new_order: list[int], current_user):
        """
        دالة لترتيب الخطوات: تستقبل قائمة بـ IDs مرتبة حسب الترتيب الجديد
        """
        AccessService.require_pm_or_admin(current_user)
        
        steps = await WorkflowTemplateStepRepository.get_steps_by_template(db, template_id)
        # منطق التحقق: هل كل الـ IDs المبعوثة تنتمي للقالب؟
        step_map = {step.id: step for step in steps}
        
        if set(step_map.keys()) != set(new_order):
            raise HTTPException(status_code=400, detail="قائمة الخطوات غير متطابقة مع خطوات القالب")

        # تحديث الترتيب
        for index, step_id in enumerate(new_order):
            step = step_map[step_id]
            step.step_order = index + 1
            
        return {"detail": "تم تحديث ترتيب الخطوات بنجاح"}