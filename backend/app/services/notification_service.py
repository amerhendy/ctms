#app/services/notification_service.py
"""
Notification Service – handles in-app notifications + WebSocket broadcast
"""
from typing import Dict, Set, Optional
from fastapi import WebSocket
import json
import asyncio
from datetime import datetime


from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models import Notification, User
from app.db.enums import UserNotificationSettings
from app.repositories.notification_repository import NotificationRepository
from app.models.NotificationSettings import NotificationSettings
from app.models.UserLogs import UserLog
from app.schemas.base import apply_pagination
class ConnectionManager:
    """Manages active WebSocket connections per user."""

    def __init__(self):
        # user_id -> set of active WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: int, data: dict):
        """Send JSON message to all connections of a user."""
        if user_id in self.active_connections:
            dead = set()
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(json.dumps(data, default=str))
                except Exception:
                    dead.add(ws)
            for ws in dead:
                self.active_connections[user_id].discard(ws)

    async def broadcast(self, data: dict):
        """Send to all connected users."""
        for user_id in list(self.active_connections.keys()):
            await self.send_to_user(user_id, data)

    def is_connected(self, user_id: int) -> bool:
        return user_id in self.active_connections and bool(self.active_connections[user_id])


# Global instance
ws_manager = ConnectionManager()

class NotificationService:
    """Service layer for notification-related operations."""

    @classmethod
    async def create(
        cls,
        db: AsyncSession,
        user_id: int,
        notification_type: str,
        title: str,
        body: str,
        related_task_id: Optional[int] = None,
        extra_data: Optional[dict] = None,
        send_ws: bool = True,
    ) -> Notification:
        """Create a DB notification and push it via WebSocket."""
        notif = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            body=body,
            related_task_id=related_task_id,
            extra_data=json.dumps(extra_data) if extra_data else None,
        )
        db.add(notif)
        await db.flush()

        if send_ws:
            await ws_manager.send_to_user(user_id, {
                "event": "notification",
                "data": {
                    "id": notif.id,
                    "type": notification_type,
                    "title": title,
                    "body": body,
                    "related_task_id": related_task_id,
                    "created_at": datetime.utcnow().isoformat(),
                }
            })

        return notif
        
    @classmethod
    async def notify_task_transfer(
        cls,
        db: AsyncSession,
        task_id: int,
        task_title: str,
        from_user_id: int,
        to_user_id: int,
        from_dept_name: str,
        to_dept_name: str,
    ):
        """Notify recipient of a transfer request."""
        await cls.create(
            db, to_user_id,
            notification_type="transfer_request",
            title="طلب تحويل مهمة",
            body=f'تم إرسال مهمة "{task_title}" من {from_dept_name} إليك في {to_dept_name}',
            related_task_id=task_id,
            extra_data={"from_user_id": from_user_id},
        )

    @classmethod
    async def notify_transfer_response(
        cls,
        db: AsyncSession,
        task_id: int,
        task_title: str,
        from_user_id: int,
        to_user_id: int,
        accepted: bool,
        reason: Optional[str] = None,
    ):
        """Notify sender of transfer accept/reject."""
        if accepted:
            notif_type = "transfer_accepted"
            title = "تم قبول تحويل المهمة"
            body = f'تم قبول مهمة "{task_title}" من المستلم'
        else:
            notif_type = "transfer_rejected"
            title = "تم رفض تحويل المهمة"
            body = f'تم رفض مهمة "{task_title}". السبب: {reason or "لم يُحدد"}'

        await cls.create(
            db, from_user_id,
            notification_type=notif_type,
            title=title,
            body=body,
            related_task_id=task_id,
        )


    @classmethod
    async def notify_step_update(
        cls,
        db: AsyncSession,
        user_id: int,
        task_id: int,
        step_title: str,
        action: str, # مثال: "تم الإنجاز" أو "تم الإنشاء"
    ):
        """إشعار خاص بتحديثات خطوات المهام"""
        await cls.create(
            db, 
            user_id=user_id,
            notification_type="step_update",
            title="تحديث في خطوات المهمة",
            body=f'الخطوة "{step_title}" : {action}',
            related_task_id=task_id
        )
        
    @classmethod
    async def notify_urgency_request(
        cls,
        db: AsyncSession,
        task_id: int,
        task_title: str,
        requester_id: int,
        owner_id: int,
        dept_manager_id: Optional[int],
    ):
        """Notify task owner + dept manager of urgency request."""
        body = f'تم طلب استعجال المهمة "{task_title}"'

        for uid in {owner_id, dept_manager_id} - {None, requester_id}:
            await cls.create(
                db, uid,
                notification_type="urgent_request",
                title="طلب استعجال مهمة",
                body=body,
                related_task_id=task_id,
                extra_data={"requester_id": requester_id},
            )

    @classmethod
    async def get_paginated(cls, repo: NotificationRepository, user_id: int, unread_only: bool, params: dict):
        query = await repo.get_query(user_id)
        if unread_only:
            query = query.where(Notification.read_at.is_(None))
        return await apply_pagination(repo.db, query, Notification, **params, sort_by="created_at", sort_order="desc")

    @classmethod
    async def mark_read(cls, repo: NotificationRepository, notif_id: int, user_id: int):
        notif = await repo.find_by_id(notif_id, user_id)
        if not notif: raise HTTPException(status.HTTP_404_NOT_FOUND, "الإشعار غير موجود")
        if not notif.read_at:
            notif.read_at = datetime.utcnow()
            await repo.db.commit()

    @classmethod
    async def get_unread_count(cls, repo: NotificationRepository, user_id: int) -> int:
        return await repo.get_unread_count(user_id)

    @classmethod
    async def mark_all_read(cls, repo: NotificationRepository, user_id: int):
        await repo.mark_all_as_read(user_id)
    
    @classmethod
    async def clear_read_notifications(cls, repo: NotificationRepository, user_id: int) -> int:
        return await repo.delete_all_read(user_id)

    @classmethod
    async def mark_single_as_read(cls, repo: NotificationRepository, notif_id: int, user_id: int):
        notif = await repo.find_by_id(notif_id, user_id)
        if not notif:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "الإشعار غير موجود")
        
        if not notif.read_at:
            await repo.update_read_status(notif)
    
    @classmethod
    async def delete_single(cls, repo: NotificationRepository, notif_id: int, user_id: int):
        # استخدام الدالة المحدثة من الـ Repository
        success = await repo.soft_delete(notif_id, user_id)
        if not success:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "الإشعار غير موجود")

    @staticmethod
    async def update_settings(db,current_user, user_id: int, new_data: dict):
        # 1. جلب الإعدادات الحالية
        result = await db.execute(select(NotificationSettings).where(NotificationSettings.user_id == user_id))
        settings = result.scalar_one_or_none()
        
        if not settings:
            # إذا لم توجد إعدادات، ننشئ واحدة جديدة
            settings = NotificationSettings(user_id=user_id)
            db.add(settings)
        
        # 2. تحضير البيانات القديمة للمقارنة (Old Data)
        old_data = {
            "browser": settings.browser, "email": settings.email,
            "whatsapp": settings.whatsapp, "telegram": settings.telegram,
            "sms": settings.sms, "google": settings.google
        }
        
        # 3. تحديث الإعدادات بالقيم الجديدة
        for key, value in new_data.items():
            if hasattr(settings, key):
                setattr(settings, key, value)
        
        # 4. تسجيل التغيير في Log (Audit Trail)
        log = UserLog(
            user_id=user_id,
            action=UserNotificationSettings.UPDATE.value,
            old_data=old_data,
            new_data=new_data
        )
        db.add(log)
        
        await db.commit()
        return settings
    
    async def create_notification_bg(notification_type,user_id, title, body, related_task_id):
        # 1. افتح جلسة جديدة تماماً لكل مهمة خلفية
        async with AsyncSessionLocal() as session:
            try:
                # 2. استدعِ الدالة الخاصة بك (مرر الـ session الجديدة)
                await NotificationService.create(
                    session, 
                    user_id=user_id,
                    notification_type=notification_type,
                    title=title,
                    body=body,
                    related_task_id=related_task_id
                )
                # 3. يجب عمل commit هنا لأنك خارج سياق الطلب
                await session.commit()
                #print(f"SUCCESS: Notification saved for user {user_id}")
            except Exception as e:
                print(f"Error in background task: {e}")
                await session.rollback()
                
    @staticmethod
    async def trigger_next_steps_notifications(db: AsyncSession, workflow_id: int):
        # 1. جلب كل الخطوات التي حالتها 'pending' في هذا الـ workflow
        # 2. التحقق من كل واحدة: هل كل الأباء لها أصبحوا 'completed'؟
        # 3. إذا أصبحت الخطوة جاهزة، قم بإرسال تنبيه للمسؤول عنها
        
        from app.repositories.TaskWorkflowStep_repo import TaskWorkflowStepRepository
        from app.services.TaskWorkflowStep_service import TaskWorkflowStepService
        next_steps = await TaskWorkflowStepRepository.get_pending_steps(db, workflow_id)
        
        for step in next_steps:
            if await TaskWorkflowStepService.are_all_parents_completed(db, step.id):
                title = "خطوة جاهزة للتنفيذ"
                notification_type = "step_ready"
                user_id = step.assigned_user_id
                # إرسال التنبيه
                await ws_manager.send_to_user(user_id, {
                    "event": "notification",
                    "data": {
                        "id": step.id,
                        "type": notification_type,
                        "title": title,
                        "body": f"الخطوة '{step.title}' أصبحت جاهزة للتنفيذ",
                        "created_at": datetime.utcnow().isoformat(),
                    }
                })