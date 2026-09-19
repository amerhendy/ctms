#app/services/share_service.py
from fastapi import HTTPException,BackgroundTasks
from datetime import datetime
from app.repositories.task_repo import TaskRepository
from app.repositories.user_repository import UserRepository
from app.repositories.TaskAssignments_repo import TaskAssignmentRepository
from app.services.permission_service import can_share_externally
from app.core.permissions import get_task_permissions, require_view_permission
from app.models import (Task,TaskAssignment)
from app.services.notification_service import NotificationService
from app.services.log_service import LogService
from app.services.task_service import TaskService
from app.db.enums import AssignmentType,TaskActionType
class taskAsignmentService:
    @staticmethod
    async def assign_user(db,current_user,task_id,user_id,assignment_type,background_tasks):
        #check if task exists
        task=await TaskService.get_task_or_404(db=db,task_id=task_id)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_assign_executor:
            raise HTTPException(403, "غير مصرح لك بتعيين مستخدمين لهذه المهمة")
        
        target_user=await UserRepository.check_if_user_exists(db,user_id=user_id)
        if not target_user:
            raise HTTPException(404, "المستخدم غير موجود")
        existing=await TaskAssignmentRepository.get_active_assignment(db=db,task_id=task_id,user_id=user_id)
        if existing:
            raise HTTPException(400, "المستخدم مُعيَّن بالفعل في هذه المهمة")
        assignment = await TaskAssignmentRepository.create_task_assignment(db, {
            "task_id": task_id,
            "user_id": user_id,
            "assignment_type": assignment_type,
            "assigned_by": current_user.id
        })
        snapshot = {
            "assigned_user_id": target_user.id,
            "assigned_user_name": target_user.full_name,
            "assignment_type": assignment_type.value,
            "assignment_id": assignment.id
        }
        background_tasks.add_task(LogService.log_action,
            db=db,
            task_id=task_id,
            user_id=current_user.id,
            action_type=TaskActionType.ASSIGNED,  # استخدام الـ Enum الموحد
            old_value=None,
            new_value=snapshot,
            extra_data=None
        )
        background_tasks.add_task(
            NotificationService.create,
            db, user_id, "task_assigned",
            "تم تعيينك في مهمة",
            f'تم تعيينك في المهمة: "{task.title}" بواسطة {current_user.full_name}',
            related_task_id=task_id,
        )
        await db.commit()
        return {"message": "تم تعيين الموظف بنجاح وتوثيق السجل الإداري للحركة"}
        
    @staticmethod
    async def unassign_user(db,current_user,task_id: int,user_id: int,background_tasks):
        task=await TaskService.get_task_or_404(db=db,task_id=task_id)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_unassign_executor:
            raise HTTPException(403, "غير مصرح لك بإلغاء تعيين مستخدمين من هذه المهمة")
        assignment=await TaskAssignmentRepository.get_active_assignment(db=db,task_id=task_id,user_id=user_id)
        if not assignment:
            raise HTTPException(404, "التعيين غير موجود أو تم إلغاؤه بالفعل")
        target_user=await UserRepository.check_if_user_exists(db,user_id=user_id)
        target_user_name = target_user.full_name if target_user else f"User #{user_id}"
        snapshot = {
            "unassigned_user_id": user_id,
            "unassigned_user_name": target_user_name, # حفظ الاسم يضمن سرعة تحميل الـ Timeline في الفرونت إند
            "assignment_type": assignment.assignment_type.value if hasattr(assignment.assignment_type, 'value') else assignment.assignment_type,
            "assigned_at": assignment.created_at.isoformat() if hasattr(assignment, 'created_at') and assignment.created_at else None
        }
        await TaskAssignmentRepository.un_assign(db,assignment=assignment)
        
        background_tasks.add_task(LogService.log_action,
            db=db,
            task_id=task_id,
            user_id=current_user.id,
            action_type=TaskActionType.UNASSIGNED,
            old_value=None,
            new_value=snapshot,
            extra_data={"deletion_type": "soft_delete"}
        )
        background_tasks.add_task(
            NotificationService.create,
            db, user_id, "task_unassigned",
            "تم إلغاء تعيينك في مهمة",
            f'تم إلغاء تعيينك في المهمة: "{task.title}" بواسطة {current_user.full_name}',
            related_task_id=task_id,
        )
        await db.commit()
        return {"message": "تم إلغاء التعيين بنجاح وتوثيق العملية تاريخياً"}

    @staticmethod
    async def restore_assignment(db, current_user, task_id, user_id, background_tasks):
        # 1. جلب المهمة والتحقق من الصلاحيات
        task = await TaskService.get_task_or_404(db, task_id)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_assign_executor:
            raise HTTPException(403, "غير مصرح لك بإعادة التعيين")

        # 2. جلب التعيين المحذوف
        assignment = await TaskAssignmentRepository.get_deleted_assignment(db, task_id, user_id)
        if not assignment:
            raise HTTPException(404, "لا يوجد تعيين محذوف لهذا الموظف")

        # 3. جلب بيانات المستخدم وتجهيز الـ Snapshot
        target_user = await UserRepository.check_if_user_exists(db, user_id)
        target_name = target_user.full_name if target_user else f"User #{user_id}"
        
        snapshot = {
            "restored_user_id": user_id,
            "restored_user_name": target_name,
            "assignment_type": assignment.assignment_type.value if hasattr(assignment.assignment_type, 'value') else assignment.assignment_type,
            "previous_deleted_at": assignment.deleted_at.isoformat()
        }

        # 4. التنفيذ
        await TaskAssignmentRepository.restore_assign(db, assignment)

        # 5. Log و Notification (خلفية)
        background_tasks.add_task(LogService.log_action, db, task_id, current_user.id, 
                                 TaskActionType.ASSIGN_RESTORED, new_value=snapshot, 
                                 extra_data={"restoration_method": "manual_action"})
        
        background_tasks.add_task(NotificationService.create, db, user_id, "task_assigned",
                                 "تم إعادة تعيينك", f'تم استعادة تعيينك للمهمة "{task.title}"', related_task_id=task_id)

        await db.commit()
        return {"message": "تم استعادة التعيين بنجاح"}
    
    @staticmethod
    async def get_task_assignments(db, task_id):
        # التأكد من وجود المهمة
        task = await TaskService.get_task_or_404(db, task_id)
        
        # جلب البيانات
        assignments = await TaskAssignmentRepository.get_active_assignments_by_task(db, task_id)
        
        # تنسيق البيانات
        return [
            {
                "id": a.id,
                "task_id": a.task_id,
                "user_id": a.user_id,
                "assignment_type": a.assignment_type,
                "assigned_at": a.assigned_at,
                "user": {
                    "id": a.user.id,
                    "full_name": a.user.full_name,
                    "avatar_url": getattr(a.user, 'avatar_url', None),
                    "job_title": getattr(a.user, 'job_title', None),
                } if a.user else None,
                "assigner": {
                    "id": a.assigner.id,
                    "full_name": a.assigner.full_name,
                } if a.assigner else None
            } for a in assignments
        ]