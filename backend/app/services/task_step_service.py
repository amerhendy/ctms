# app/services/task_step_service.py
from fastapi import HTTPException, status as http_status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.TaskStep import TaskStep
from app.repositories.task_step_repo import TaskStepRepository
from app.schemas.task_steps import TaskStepCreate, TaskStepUpdate, StepReorderItem,TaskStepOut

from app.db.enums import StepStatus
from app.core.permissions import get_task_permissions
from datetime import datetime
from app.schemas.base import  apply_pagination
from app.services.notification_service import NotificationService
from fastapi import BackgroundTasks
from app.core.utils import logger
class TaskStepService:
    @staticmethod
    async def create(db: AsyncSession, task_id: int, data: TaskStepCreate, current_user, background_tasks: BackgroundTasks):
        # 1. التحقق من المهمة والصلاحيات
        from app.services.task_service import TaskService
        task = await TaskService.get_task_or_404(db, task_id)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_add_step:
            raise HTTPException(status_code=403, detail="غير مصرح بإضافة خطوات لهذه المهمة")

        # 2. تحديد الترتيب
        new_order = data.step_order
        if new_order is None:
            last_order = await TaskStepRepository.get_max_order(db, task_id)
            new_order = last_order + 1
            
        # 3. إنشاء الكيان الجديد
        step_data = data.model_dump()
        step_data["step_order"] = new_order
        new_step = TaskStep(task_id=task_id, **step_data)
        print(f"DEBUG: Status value being sent is: {new_step.status}")
        print(f"DEBUG: Type of status is: {type(new_step.status)}")
        # 4. الحفظ في قاعدة البيانات أولاً للحصول على الـ ID
        step = await TaskStepRepository.create(db, new_step)
        await db.commit()
        await db.refresh(step) # تحديث الكائن بالبيانات القادمة من DB

        # 5. إرسال الإشعارات بعد نجاح الحفظ
        target_user_ids = await TaskService.get_task_staff(db, task)
        for user_id in target_user_ids:
            background_tasks.add_task(
                NotificationService.create_notification_bg,
                "step_created", # تغيير النوع ليكون أدق
                user_id=user_id,
                title="تم إضافة خطوة جديدة",
                body=f"تم إضافة الخطوة '{step.title}' في المهمة '{task.title}'",
                related_task_id=task_id
            )
            
        return step

    @staticmethod
    async def update(db: AsyncSession, task_id: int, step_id: int, data: TaskStepUpdate, current_user, background_tasks: BackgroundTasks):
        logger.debug(data)
        # 1. التحقق من المهمة والصلاحيات
        from app.services.task_service import TaskService
        task = await TaskService.get_task_or_404(db, task_id)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_edit_step:
            raise HTTPException(status_code=403, detail="غير مصرح بتعديل خطوات لهذه المهمة")
        
        # 2. تجهيز البيانات
        step_to_update = await TaskStepRepository.get_by_id(db, step_id)
        old_order = step_to_update.step_order
        new_order = data.step_order

        # 2. منطق إعادة الترتيب (إذا كان هناك تغيير في الترتيب)
        if new_order and new_order != old_order:
            # جلب جميع الخطوات الخاصة بنفس المهمة
            all_steps = await TaskStepRepository.get_steps_by_task(db, task_id)
            
            if new_order < old_order:
                # الحركة للأعلى: الخطوات بين new_order و old_order يتم زيادة ترتيبهم
                for s in all_steps:
                    if new_order <= s.step_order < old_order:
                        await TaskStepRepository.update(db, s.id, {"step_order": s.step_order + 1})
            else:
                # الحركة للأسفل: الخطوات بين old_order و new_order يتم تقليل ترتيبهم
                for s in all_steps:
                    if old_order < s.step_order <= new_order:
                        await TaskStepRepository.update(db, s.id, {"step_order": s.step_order - 1})

        # 3. تحديث البيانات الأصلية (بما فيها الـ step_order الجديد)
        update_data = data.model_dump(exclude_unset=True)
        await TaskStepRepository.update(db, step_id, update_data)
        
        await db.commit()
        
        # 4. إرسال الإشعارات بعد الحفظ الناجح
        target_user_ids = await TaskService.get_task_staff(db, task)
        for user_id in target_user_ids:
            background_tasks.add_task(
                NotificationService.create_notification_bg,
                "step_updated", # تم تعديل الاسم ليكون أدق
                user_id=user_id,
                title="تم تعديل خطوة",
                body=f"تم تعديل تفاصيل الخطوة في المهمة '{task.title}'",
                related_task_id=task_id
            )
        
        # جلب البيانات المحدثة لإرجاعها للفرونت إند
        return await TaskStepRepository.get_by_id(db, step_id)

    @staticmethod
    async def change_status(db: AsyncSession, task_id: int, step_id: int, new_status: StepStatus, current_user, background_tasks: BackgroundTasks):
        from app.services.task_service import TaskService
        task = await TaskService.get_task_or_404(db, task_id)
        step = await TaskStepRepository.get_by_id(db, step_id)
        
        if not step:
            raise HTTPException(status_code=404, detail="الخطوة غير موجودة")
        
        # التأكد من أن الخطوة تابعة للمهمة فعلياً
        if step.task_id != task_id:
            raise HTTPException(status_code=400, detail="الخطوة لا تنتمي لهذه المهمة")

        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_edit_step:
            raise HTTPException(403, "غير مصرح بتعديل هذه الخطوة")

        update_data = {"status": new_status}
        
        # منطق تغيير الحالة
        if new_status == StepStatus.COMPLETED:
            update_data.update({
                "completed_at": datetime.now(),
                "completed_by": current_user.id
            })
        elif new_status == StepStatus.IN_PROGRESS and not step.started_at:
            update_data.update({"started_at": datetime.now()})
            
        await TaskStepRepository.update(db, step_id, update_data)
        await db.commit()
        await db.refresh(step) # تحديث كائن الـ step قبل الإشعار

        # إرسال الإشعار بحالة الخطوة الجديدة
        target_user_ids = await TaskService.get_task_staff(db, task)
        for user_id in target_user_ids:
            background_tasks.add_task(
                NotificationService.create_notification_bg,
                "step_status_changed",
                user_id=user_id,
                title="تغير حالة خطوة",
                body=f"أصبحت حالة الخطوة '{step.title}' في المهمة '{task.title}' هي: {new_status.value}",
                related_task_id=task_id
            )
        
        return {
            "id": step.id, 
            "status": step.status, 
            "completed_at": step.completed_at,
            "completed_by": step.completed_by
        }

    @staticmethod
    async def delete(db: AsyncSession, task_id: int, step_id: int, current_user, background_tasks: BackgroundTasks):
        from app.services.task_service import TaskService
        task = await TaskService.get_task_or_404(db, task_id)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_edit_step:
            raise HTTPException(status_code=403, detail="غير مصرح بتعديل خطوات لهذه المهمة")

        # 1. جلب بيانات الخطوة قبل الحذف لإدراجها في الإشعار
        step = await TaskStepRepository.get_by_id(db, step_id)
        if not step:
             raise HTTPException(status_code=404, detail="الخطوة غير موجودة")

        # 2. الحذف وإعادة الترتيب
        await TaskStepRepository.delete(db, step_id)
        await TaskStepRepository.reindex_all(db, task_id)
        await db.commit()

        # 3. إرسال إشعار بالحذف
        target_user_ids = await TaskService.get_task_staff(db, task)
        for user_id in target_user_ids:
            background_tasks.add_task(
                NotificationService.create_notification_bg,
                "step_deleted",
                user_id=user_id,
                title="تم حذف خطوة",
                body=f"تم حذف الخطوة '{step.title}' من المهمة '{task.title}'",
                related_task_id=task_id
            )

        return {"message": "تم حذف الخطوة بنجاح وإعادة ترتيب الخطوات المتبقية"}

    @staticmethod
    async def reorder(db: AsyncSession, task_id: int, steps: list[StepReorderItem], current_user, background_tasks: BackgroundTasks):
        # 1. التحقق من المهمة والصلاحيات
        from app.services.task_service import TaskService
        task = await TaskService.get_task_or_404(db, task_id)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_edit_step:
            raise HTTPException(status_code=403, detail="غير مصرح بتعديل ترتيب الخطوات")
        
        # 2. تنفيذ التحديث الجماعي وإعادة الترقيم
        await TaskStepRepository.bulk_update_order(db, steps)
        await TaskStepRepository.reindex_all(db, task_id)
        await db.commit()
        
        # 3. إرسال إشعار للفريق بأن الترتيب قد تغير
        target_user_ids = await TaskService.get_task_staff(db, task)
        for user_id in target_user_ids:
            background_tasks.add_task(
                NotificationService.create_notification_bg,
                "step_reordered",
                user_id=user_id,
                title="تم تغيير ترتيب الخطوات",
                body=f"قام {current_user.full_name} بتغيير ترتيب الخطوات في المهمة '{task.title}'",
                related_task_id=task_id
            )
            
        return {"message": "تم إعادة ترتيب الخطوات بنجاح لضمان سلامة التسلسل"}
    
    @staticmethod
    async def get_steps_by_task(db: AsyncSession, task_id: int, current_user):
        # 1. التحقق من المهمة والصلاحيات
        from app.services.task_service import TaskService
        task = await TaskService.get_task_or_404(db, task_id)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_view: # تأكد من اسم الصلاحية المناسب لديك
             raise HTTPException(status_code=403, detail="غير مصرح بعرض خطوات هذه المهمة")

        # 2. بناء الاستعلام من الـ Repository
        steps = await TaskStepRepository.get_steps_by_task(db, task_id)
        return [TaskStepOut.model_validate(step) for step in steps]