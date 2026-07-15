# app/services/task_comment_service.py
from fastapi import HTTPException
from datetime import datetime

from app.core.utils import logger
from app.schemas.base import get_task_or_404,apply_pagination
from app.core.permissions import require_view_permission, get_task_permissions

from app.models.User import User
from app.models.TaskComment import TaskComment
from app.schemas.task_comment_sch import CommentOut
from app.repositories.comment_repository import CommentRepository
from app.services.log_service import LogService
from app.services.task_service import TaskService
from app.services.notification_service import NotificationService,ws_manager

class CommentService:
    @staticmethod
    async def add_comment(db, task_id: int, comment_text: str, current_user):
        task = await get_task_or_404(db, task_id)
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_add_comment:
            raise HTTPException(403, "غير مصرح لك بإضافة تعليق بداخل هذه المهمة")
        
        comment = TaskComment(
            task_id=task_id,
            user_id=current_user.id,
            comment_text=comment_text
        )
        db.add(comment)
        await db.flush()
        #add log
        await LogService.log_action(db, task_id, current_user.id, "comment_added", new_value=f"comment_id:{comment.id}")
        #get all recipients
        recipients=await TaskService.get_people_intask(db,task)
        comment_payload = {
            "event": "comment_created",
            "task_id": task_id,
            "comment": {
                "id": comment.id,
                "comment_text": comment.comment_text,
                "user_id": current_user.id,
                "user_name": current_user.full_name,
                "created_at": datetime.now().isoformat()
            }
        }
        # إرسال الإشعارات والبث
        for user_id in recipients:
            await NotificationService.create(
                db, user_id, "new_comment",
                "تعليق جديد على المهمة",
                f'قام الموظف {current_user.full_name} بإضافة تعليق جديد على مهمة تشترك بها "{task.title}"',
                related_task_id=task_id
            )
            try:
                if hasattr(ws_manager, "send_personal_message"):
                    await ws_manager.send_to_user(user_id,comment_payload)
                elif hasattr(ws_manager, "broadcast"):
                    await ws_manager.broadcast(comment_payload)
            except Exception as e:
                logger.debug(f"Failed to send WS message to user {user_id}: {e}")

        await db.commit()
        return {"id": comment.id, "message": "تمت إضافة التعليق وبثه فوراً للمشاركين"}
    
    @staticmethod
    async def update_comment(db,task_id,comment_id,comment_text,current_user):
        task = await get_task_or_404(db, task_id)
        comment=await CommentRepository.get_comment_by_task_comment(db,task_id,comment_id)
        if not comment:
            raise HTTPException(404, "التعليق غير موجود")
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_edit_comment(comment.user_id, current_user.id):
            raise HTTPException(403, "غير مصرح! لا يمكنك تعديل هذا التعليق")
        
        comment.comment_text = comment_text
        comment.updated_at = datetime.now()

        await LogService.log_action(
            db, task_id, current_user.id, "comment_updated",
            new_value=f"comment_id:{comment_id}",
            extra_data=f"تم تعديل التعليق بواسطة {current_user.full_name}"
        )
        await db.commit()
        return {"message": "تم تعديل التعليق بنجاح"}
    
    @staticmethod
    async def delete_comment(db,task_id,comment_id,current_user):
        task = await get_task_or_404(db, task_id)
        comment=await CommentRepository.get_comment_by_task_comment(db,task_id,comment_id)
        if not comment:
            raise HTTPException(404, "التعليق غير موجود")
        perms = await get_task_permissions(db, current_user, task)
        if not perms.can_delete_comment(comment.user_id, current_user.id):
            raise HTTPException(403, "غير مصرح! لا يمكنك تعديل هذا التعليق")
        await db.delete(comment)
        await LogService.log_action(
            db, task_id, current_user.id, "comment_deleted",
            old_value=f"comment_id:{comment_id}",
            extra_data=f"تم حذف التعليق بواسطة {current_user.full_name}"
        )
        await db.commit()
        return {"message": "تم حذف التعليق بنجاح"}

    @staticmethod
    async def list_comments(db, task_id: int,page:int,limit:int,current_user:User):
        task = await get_task_or_404(db, task_id)
        await require_view_permission(db, current_user, task)
        query=CommentRepository.base_query()
        base_query=query.where(TaskComment.task_id == task_id)
        paginated_result = await apply_pagination(
            db=db,
            base_query=base_query,
            model_class=CommentOut, 
            page=page,
            page_size=limit
        )
        paginated_result["items"] = [CommentOut.from_orm(c) for c in paginated_result.get("items", [])]
        
        paginated_result["has_more"] = page < paginated_result.get("pages", 1)

        return paginated_result
    