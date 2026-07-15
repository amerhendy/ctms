from fastapi import HTTPException,BackgroundTasks
from datetime import datetime,timezone
from app.models import Task
from app.repositories.task_repo import TaskRepository
from app.repositories.task_step_repo import TaskStepRepository
from app.repositories.TaskAssignments_repo import TaskAssignmentRepository
from app.db.enums import GlobalRole, TaskStatus,  AssignmentType, UrgencyStatus,TaskActionType
from app.schemas.base import  apply_pagination
from app.schemas.tasks import TaskOut,TaskListItem
from app.db.enums import GlobalRole, TaskStatus, AssignmentType, UrgencyStatus
from app.services.notification_service import NotificationService
from app.services.log_service import LogService
from app.repositories.favorite_repo import FavoriteRepository
from app.core.permissions import require_view_permission
from app.core.permissions import get_task_permissions
from app.core.permissions import require_transfer_task_permission
from app.core.permissions import require_delete_permission
from app.repositories.user_repository import UserRepository
from app.schemas.tasks import TaskOut
from app.models import TaskAssignment, TaskStep
from app.models.TaskStep import TaskStep
from app.core.utils import logger
from app.services.department_manager_service import DeptManagerService
from app.services.task_step_service import TaskStepService
from app.repositories.delegation_repo import DelegationRepository
from app.repositories.taskShare_rep import TaskShareRepository

from app.core.utils import make_naive
class TaskService:
    @staticmethod
    async def get_paginated_tasks(db, current_user, filters, pagination):
        query = TaskRepository.get_base_query()
        query = await TaskRepository.apply_user_access(query, current_user,db)
        query = await TaskRepository.apply_filters(query, filters, current_user)
        result=await apply_pagination(
            db=db,
            base_query=query,
            model_class=Task,
            page=pagination["page"],
            page_size=pagination["page_size"],
            search_query=filters.get("q"),
            search_column="title",
            sort_by=pagination["sort_by"],
            sort_order=pagination["sort_order"],
            schema_class=TaskOut
        )
        return result
    
    @staticmethod
    async def create_new_task_department_check(task_data,current_user):
        target_dept_id = task_data.department_id
        if target_dept_id:
            # تحقق من أن المستخدم لديه حق الوصول إلى القسم المستهدف
            if current_user.global_role not in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER):
                if target_dept_id != current_user.department_id:
                    raise HTTPException(403, "لا يمكنك إنشاء مهمة في قسم آخر غير قسمك")
        else:
            target_dept_id = current_user.department_id
            if target_dept_id is None and current_user.global_role not in (GlobalRole.GLOBAL_ADMIN, GlobalRole.PROGRAM_MANAGER):
                raise HTTPException(403, "يجب تحديد قسم للمهمة أو أن يكون لديك صلاحيات إدارية")
    @staticmethod
    async def create_new_task_collect_data(db,task_data,current_user):
        # هنا نستخدم الـ Repository لإنشاء المهمة
        return Task(
            title=task_data.title,
            description=task_data.description,
            file_number=task_data.file_number,
            start_date=task_data.start_date,
            due_date=task_data.due_date,
            reminder_datetime=make_naive(task_data.reminder_datetime),
            is_urgent=task_data.is_urgent,
            is_important=task_data.is_important,
            priority=task_data.priority,
            department_id=task_data.department_id,
            created_by=current_user.id,
        )


    @staticmethod
    async def create_new_task_add_assignments(db, task, task_data, current_user, background_tasks):
        # التحقق: إذا كانت القائمة فارغة أو None، نخرج فوراً
        if not task_data.assigned_ids:
            return

        # إنشاء كائنات التعيين (Assignments)
        assignments = [
            TaskAssignment(
                task_id=task.id, 
                user_id=uid, 
                assignment_type=AssignmentType.ASSIGNEE, 
                assigned_by=current_user.id
            ) 
            for uid in task_data.assigned_ids
        ]
        
        # حفظ التعيينات في قاعدة البيانات
        await TaskAssignmentRepository.create_task_assignments(db, assignments)
        
        # إضافة مهام الخلفية للإشعارات
        for uid in task_data.assigned_ids:
            background_tasks.add_task(
                NotificationService.create, 
                db, 
                uid, 
                "task_assigned", 
                "تم تعيين مهمة جديدة", 
                f'تم تعيينك في مهمة: "{task.title}"', 
                related_task_id=task.id
            )
    @staticmethod
    async def notify_department_staff(db, task_id, task_title,body, department_id, background_tasks,current_user):
        # 1. جلب المديرين
        managers = await DeptManagerService.get_managers_by_dept(db, department_id)
        
        # 2. فلترة الأشخاص المستهدفين
        target_user_ids = set()
        
        if managers:
            # إضافة كل من هو مدير (سواء أساسي أو غير أساسي)
            manager_ids = [m.user_id for m in managers]
            target_user_ids.update(manager_ids)
            delegates = await DelegationRepository.get_active_delegates_for_users(db, manager_ids)
            target_user_ids.update(delegates)
        else:
            # 3. في حال عدم وجود مدير: جلب أقدم موظف في القسم كخيار احتياطي
            oldest_user_id = await UserRepository.get_oldest_employee_in_dept(db, department_id)
            if oldest_user_id:
                target_user_ids.add(oldest_user_id)
        #logger.debug(department_managers)
        # 4. إرسال الإشعارات للخلفية
        for user_id in target_user_ids:
            background_tasks.add_task(
                NotificationService.create_notification_bg,
                TaskActionType.CREATED, 
                user_id,
                task_title,
                body,
                task_id,
                
            )
            
    @staticmethod
    async def create_new_task(db, task_data, current_user, background_tasks: BackgroundTasks):
        try:
            # 1. التحقق من الصلاحيات
            await TaskService.create_new_task_department_check(task_data, current_user)
            
            # 2. إنشاء كائن المهمة
            task = await TaskService.create_new_task_collect_data(db, task_data, current_user)
            db.add(task)
            
            # 3. إجبار القاعدة على حفظ المهمة وتوليد الـ ID
            await db.flush() 
            
            # 4. الآن أصبح لدى المهمة ID حقيقي
            new_task = task 

            # 5. العمليات التابعة
            
            await TaskService.create_new_task_add_assignments(db, new_task, task_data, current_user, background_tasks)
            
            #انشاء notification لمدير الادارة
            notif_title=f"تم اضافة مهمة جديدة "+"(${task_data.title})"
            notif_body=f"تم اضافتك لمهمة بواسطة ${current_user.full_name}"
            department_id=task_data.department_id
            await TaskService.notify_department_staff(
                db=db,
                task_id=task.id,
                task_title=notif_title,
                body=notif_body,
                department_id=department_id,
                background_tasks=background_tasks,
                current_user=background_tasks)
            
            # 6. تسجيل العملية (الآن سيعمل Log بنجاح لأن الـ ID موجود)
            await LogService.log_action(db,new_task.id, current_user.id, "created", new_value=f"{task_data.title}")
            
            # 7. الالتزام النهائي
            await db.commit()
            await db.refresh(new_task)
            
            return new_task

        except Exception as e:
            await db.rollback()
            raise e

    @staticmethod
    async def get_task_details(db, task_id, current_user):
        
        logger.debug(f"DEBUG: Task ID is: {task_id}") # أضف هذا السطر
        logger.debug(f"DEBUG: Type of Task ID is: {type(task_id)}") # أضف هذا السطر
        #task = await TaskRepository.get_task_by_id(db=db,task_id=task_id,current_user=current_user)
        task=await TaskService.get_task_or_404(db,task_id)
        if not task:
            raise HTTPException(404, "المهمة غير موجودة أو ليس لديك صلاحية الوصول إليها")
        
        task_staff=await TaskService.get_task_staff(db,task)
        if current_user.id not in task_staff:
            raise HTTPException(404, "المهمة غير موجودة أو ليس لديك صلاحية الوصول إليها")
        
        
        await require_view_permission(db, current_user, task)
        task_out = TaskOut.from_orm(task)
        task_out.permissions = await TaskService.task_persmession(db, current_user, task)
        task_out.is_favorite = await TaskService.check_is_favorite(db, current_user.id, task)
        return task_out

    @staticmethod
    async def task_persmession(db, current_user, task):
        perms = await get_task_permissions(db, current_user, task)
        return {
            "can_view": perms.can_view, "can_edit_task": perms.can_edit_task, "can_delete_task": perms.can_delete_task,
            "can_transfer_task": perms.can_transfer_task, "can_change_status": perms.can_change_status,
            "can_share_add": perms.can_share_add, "can_share_remove": perms.can_share_remove,
            "can_request_urgency": perms.can_request_urgency, "can_respond_urgency": perms.can_respond_urgency,
            "can_convert_task": perms.can_convert_task, "can_add_step": perms.can_add_step,
            "can_delete_step": perms.can_delete_step, "can_edit_step": perms.can_edit_step,
            "can_assign_executor": perms.can_assign_executor, "can_unassign_executor": perms.can_unassign_executor,
            "can_edit_executor": perms.can_edit_executor, "can_add_comment": perms.can_add_comment,
            "can_edit_any_comment": perms.can_edit_any_comment, "can_edit_own_comment": perms.can_edit_own_comment,
            "can_delete_any_comment": perms.can_delete_any_comment, "can_delete_own_comment": perms.can_delete_own_comment,
            "can_add_attachment": perms.can_add_attachment, "can_view_attachment": perms.can_view_attachment,
            "can_delete_any_attachment": perms.can_delete_any_attachment, "can_delete_own_attachment": perms.can_delete_own_attachment,
        }
    @staticmethod
    async def check_is_favorite(db, user_id, task):
        is_fav = any(fav.user_id == user_id for fav in task.favorites)
        return is_fav


    @staticmethod
    async def update_task(db, task_id, data, current_user, background_tasks):
        # 1. جلب المهمة (استدعاء الـ Repository)
        task = await TaskRepository.get_task_by_id(db, task_id, current_user)
        if not task:
            raise HTTPException(404, "المهمة غير موجودة")

        # 2. الحصول على الصلاحيات
        perms = await get_task_permissions(db, current_user, task)
        update_data = data.model_dump(exclude_unset=True)
        changes = []

        # 3. منطق التحديث والتحقق (نقلناه من الـ Router)
        for field, new_val in update_data.items():
            if field == "department_id" and new_val != task.department_id:
                await require_transfer_task_permission(db, current_user, task)
            # التحقق من الصلاحية لكل حقل
            elif not TaskService.is_field_editable(field, perms):
                raise HTTPException(403, f"لا تملك صلاحية تعديل {field}")
            
            old_val = getattr(task, field)
            if old_val != new_val:
                setattr(task, field, new_val)
                changes.append((field, old_val, new_val))

        # 4. المنطق الخاص (Progress -> Completed)
        if task.progress_percentage == 100 and task.status != TaskStatus.COMPLETED:
            task.status = TaskStatus.COMPLETED
            
        # 5. تسجيل التغييرات (Background Tasks)
        for field, old, new in changes:
            background_tasks.add_task(LogService.log_action,  task.id, current_user.id, "edited", old_value=old, new_value=new)

        await db.commit()
        return {"message": "تم التحديث بنجاح"}


    @staticmethod
    def is_field_editable(field: str, perms) -> bool:
        """خريطة الصلاحيات لكل حقل"""
        permissions_map = {
            "title": perms.can_edit_basic,
            "description": perms.can_edit_basic,
            "file_number": perms.can_edit_basic,
            "start_date": perms.can_edit_dates,
            "due_date": perms.can_edit_dates,
            "reminder_datetime": perms.can_edit_dates,
            "priority": perms.can_edit_priority,
            "is_important": perms.can_edit_priority,
            "is_urgent": perms.can_edit_priority,
            "progress_percentage": perms.can_change_status,
            "status": perms.can_change_status,
            "department_id": True # سنقوم بمعالجته في الـ Service بشكل خاص للتحقق من الصلاحية
        }
        return permissions_map.get(field, False)

    @staticmethod
    async def delete_task(db, task_id, current_user, background_tasks):
        # 1. جلب المهمة (استخدام الـ Repository)
        task = await TaskRepository.get_task_by_id(db, task_id, current_user)
        if not task:
            raise HTTPException(404, "المهمة غير موجودة")

        # 2. التحقق من صلاحية الحذف
        await require_delete_permission(db, current_user, task)

        # 3. جمع المعنيين (منطق الـ set)
        affected_user_ids = {task.created_by}
        affected_user_ids.update(a.user_id for a in task.assignments)
        affected_user_ids.update(s.shared_with_user_id for s in task.shares)
        affected_user_ids.update(c.user_id for c in task.comments)
        affected_user_ids.discard(current_user.id)

        # 4. تنفيذ الحذف المنطقي
        task.deleted_at = datetime.utcnow() # افترض استخدام التوقيت العالمي
        
        # 5. مهام الخلفية (اللوج والإشعارات)
        background_tasks.add_task(LogService.log_action, db, task.id, current_user.id, "soft_deleted",old_value=task.title, new_value=None,extra_data=f"تم حذف المهمة منطقياً بواسطة {current_user.full_name}")
        for uid in affected_user_ids:
            background_tasks.add_task(
                NotificationService.create, db, uid, "task_deleted",
                title="تم حذف مهمة",
                body=f'تم حذف المهمة "{task.title}" بواسطة {current_user.full_name}. لن تظهر بعد الآن.',
                related_task_id=task.id
            )

        await db.commit()
        return {"message": "تم حذف المهمة بنجاح"}
    
    @staticmethod
    async def request_urgency_task(db, task_id, data, current_user, background_tasks):
        # 1. جلب المهمة والتحقق
        task = await TaskRepository.get_task_by_id(db, task_id, current_user)
        if not task:
            raise HTTPException(404, "المهمة غير موجودة")

        # 2. الصلاحيات والحالة
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_request_urgency:
            raise HTTPException(403, "غير مصرح لك بطلب استعجال هذه المهمة")
        
        if task.urgency_request_status == UrgencyStatus.PENDING:
            raise HTTPException(400, "يوجد طلب استعجال قيد الانتظار بالفعل")

        # 3. تحديث المهمة
        task.urgency_requested_at = datetime.utcnow()
        task.urgency_requested_by = current_user.id
        task.urgency_request_status = UrgencyStatus.PENDING

        # 4. جلب مدير القسم (منطق الأعمال)
        dept_manager_id = await UserRepository.get_department_manager_id(db, task.department_id)

        # 5. مهام الخلفية (اللوج والإشعارات)
        background_tasks.add_task(LogService.log_action, db, task.id, current_user.id, "urgent_requested", ...)
        background_tasks.add_task(
            NotificationService.notify_urgency_request, db, task.id, task.title, 
            current_user.id, task.created_by, dept_manager_id
        )

        await db.commit()
        return {"message": "تم إرسال طلب الاستعجال"}
    
    @staticmethod
    async def respond_urgency_task(db, task_id, data, current_user, background_tasks):
        # 1. جلب المهمة (استخدام الـ Repository)
        task = await TaskRepository.get_task_by_id(db, task_id, current_user)
        if not task:
            raise HTTPException(404, "المهمة غير موجودة")

        # 2. الصلاحيات والحالة
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_respond_urgency:
            raise HTTPException(403, "غير مصرح لك بالرد على طلب استعجال هذه المهمة")
            
        if task.urgency_request_status != UrgencyStatus.PENDING:
            raise HTTPException(400, "لا يوجد طلب استعجال قيد الانتظار")

        # 3. معالجة الإجراء (Business Logic)
        if data.action == "approve":
            task.urgency_request_status = UrgencyStatus.APPROVED
            task.is_urgent = True
            action_type, notif_title = "urgent_approved", "تم قبول طلب الاستعجال"
            notif_body = f'تم قبول طلب استعجال المهمة "{task.title}" بواسطة {current_user.full_name}'
        elif data.action == "reject":
            task.urgency_request_status = UrgencyStatus.REJECTED
            action_type, notif_title = "urgent_rejected", "تم رفض طلب الاستعجال"
            notif_body = f'تم رفض طلب استعجال المهمة "{task.title}". السبب: {data.reason or "لم يُحدد"} بواسطة {current_user.full_name}'
        else:
            raise HTTPException(400, "الإجراء غير صحيح")

        # 4. مهام الخلفية (اللوج والإشعارات)
        background_tasks.add_task(
            LogService.log_action, db, task.id, current_user.id, action_type,
            new_value=data.reason,
            extra_data=f"قام بالرد: {current_user.full_name}"
            )
        
        if task.urgency_requested_by:
            background_tasks.add_task(
                NotificationService.create,
                db, task.urgency_requested_by, 
                notification_type=action_type, 
                title=notif_title, body=notif_body, related_task_id=task.id
            )

        await db.commit()
        return {"message": f"تم {data.action} طلب الاستعجال بنجاح"}
    
    @staticmethod
    async def toggle_favorite(db, task_id, current_user):
        # 1. جلب المهمة والتحقق من الصلاحية
        task = await TaskRepository.get_task_by_id(db, task_id, current_user)
        if not task:
            raise HTTPException(404, "المهمة غير موجودة")
        await require_view_permission(db, current_user, task)

        # 2. تبديل الحالة (Toggle Logic)
        fav = await FavoriteRepository.get_favorite(db, task_id, current_user.id)
        
        if fav:
            await FavoriteRepository.remove_favorite(db, fav)
            action = "favorite_removed"
            msg = "تم إزالة المهمة من المفضلة"
            is_fav = False
        else:
            await FavoriteRepository.add_favorite(db, task_id, current_user.id)
            action = "favorite_added"
            msg = "تمت إضافة المهمة للمفضلة"
            is_fav = True

        # 3. تسجيل الحدث
        await LogService.log_action(db, task_id, current_user.id, action, 
                         extra_data=f"قام {current_user.full_name} بتحديث مفضلته")
        
        await db.commit()
        return {"is_favorite": is_fav, "message": msg}
    
    @staticmethod
    async def get_task_or_404(db, task_id):
        query=TaskRepository.get_base_query()
        result=await db.execute(query.where(Task.id == task_id))
        task = result.scalar_one_or_none()
        if not task:
            raise HTTPException(404, "المهمة غير موجودة")
        return task
    
    @staticmethod
    async def get_MultipleDepsMangers(db, department_id):
        target_user_ids=set()
        # 1. جلب المديرين
        managers = await DeptManagerService.get_managers_by_dept(db, department_id)
        # 2. فلترة الأشخاص المستهدفين
        
        
        if managers:
            # إضافة كل من هو مدير (سواء أساسي أو غير أساسي)
            manager_ids = [m.user_id for m in managers]
            target_user_ids.update(manager_ids)
            delegates = await DelegationRepository.get_active_delegates_for_users(db, manager_ids)
            target_user_ids.update(delegates)
        else:
            # 3. في حال عدم وجود مدير: جلب أقدم موظف في القسم كخيار احتياطي
            oldest_user_id = await UserRepository.get_oldest_employee_in_dept(db, department_id)
            if oldest_user_id:
                target_user_ids.add(oldest_user_id)
        return target_user_ids

    @staticmethod
    async def get_task_staff(db, task):
        target_user_ids = set()
        department_id=task.department_id
        Department_managers=await TaskService.get_MultipleDepsMangers(db, department_id)
        target_user_ids.update(Department_managers)
        creator_id=task.created_by
        target_user_ids.add(creator_id)

        #المعينيين للمهمة assigns
        assigned_task_users = list({
            assignment.user_id 
            for assignment in task.assignments 
            if getattr(assignment, 'user_id', None) is not None
        })
        target_user_ids.update(assigned_task_users)

        #المشاركين
        shares=await TaskShareRepository.get_shares_by_task_id(db, task.id)
        current_time = datetime.now(timezone.utc)
        valid_share_users = list({
        share.shared_with_user_id 
        for share in shares 
            if getattr(share, 'shared_with_user_id', None) is not None 
            and (share.expires_at is None or share.expires_at.replace(tzinfo=timezone.utc) > current_time)
        })
        target_user_ids.update(valid_share_users)

        #المخصصين فى الخطوات
        assigned_users = list({
        step.assigned_user_id 
            for step in task.steps 
            if getattr(step, 'assigned_user_id', None) is not None
        })
        target_user_ids.update(assigned_users)

        # الادارات المختصة
        assigned_departments = list({
            step.assigned_department_id 
            for step in task.steps 
            if getattr(step, 'assigned_department_id', None) is not None
        })
        for dep_id in assigned_departments:
            # استدعاء الدالة لجلب مدراء الإدارة الحالية
            dept_managers = await TaskService.get_MultipleDepsMangers(db, dep_id)
            
            # التأكد من أن النتيجة ليست فارغة ثم دمجها في مجموعة المستخدمين المستهدفة
            if dept_managers:
                target_user_ids.update(dept_managers)

        return target_user_ids
        