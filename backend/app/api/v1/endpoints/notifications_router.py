"""
Notifications API + WebSocket real-time endpoint (Enhanced with Pagination & Features)
"""
import math
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import User
from app.core.security import get_current_user, decode_token
from app.services.notification_service import ws_manager
from app.schemas.base import PaginatedResponse
from app.schemas.notifications import NotificationOut
from app.repositories.notification_repository import NotificationRepository
from app.services.notification_service import NotificationService
from app.core.utils import logger
router = APIRouter(prefix="/notifications", tags=["Notifications - الإشعارات"])




# ─── 1. جلب الإشعارات المقسمة (Pagination) ───
# التعديل: نحدد الـ response_model ليتماشى مع الترقيم الموحد
@router.get("", response_model=PaginatedResponse[NotificationOut])
async def list_notifications(
    unread_only: bool = False,
    page: int = Query(1, ge=1, description="رقم الصفحة الحالية"),
    page_size: int = Query(20, ge=1, le=100, description="عدد العناصر لكل صفحة"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    جلب قائمة الإشعارات الخاصة بالمستخدم الحالي مع دعم الترقيم والفلترة.
    """
    repo = NotificationRepository(db)
    return await NotificationService.get_paginated(repo, current_user.id, unread_only, {"page": page, "page_size": page_size})


# ─── 2. جلب عدد غير المقروء ───
@router.get("/unread-count")
async def unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = NotificationRepository(db)
    count = await NotificationService.get_unread_count(repo, current_user.id)
    return {"count": count}


# ─── 3. تعيين الكل كمقروء (تم تقديمها لتجنب الـ Overlap مع الـ IDs الثابتة) ───
@router.post("/mark-all-read")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await NotificationService.mark_all_read(NotificationRepository(db), current_user.id)
    return {"message": "تم تعليم كل الإشعارات كمقروءة"}


# ─── 4. تنظيف وحذف كافة الإشعارات المقروءة ───
@router.delete("/clear-read", status_code=status.HTTP_200_OK)
async def clear_all_read_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = await NotificationService.clear_read_notifications(NotificationRepository(db), current_user.id)
    return {"message": f"تم تنظيف اللوحة وحذف {count} إشعار مقروء بنجاح"}


# ─── 5. تعيين إشعار محدد كمقروء (ديناميكي) ───
@router.post("/{notif_id}/read")
async def mark_read(
    notif_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await NotificationService.mark_single_as_read(NotificationRepository(db), notif_id, current_user.id)
    return {"message": "تم التعليم كمقروء"}


# ─── 6. حذف إشعار محدد (ديناميكي) ───
@router.delete("/{notif_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notif_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await NotificationService.delete_single(NotificationRepository(db), notif_id, current_user.id)
    return None


# ─── 7. WebSocket Endpoint ───
@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(None),
):
    # 1. التحقق من التوكن (الجانب الأمني)
    if not token:
        await websocket.accept()
        await websocket.send_json({"error": "Token missing"})
        await websocket.close(code=4001)
        return

    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub", 0))
    except Exception:
        await websocket.accept()
        await websocket.send_json({"error": "Invalid token"})
        await websocket.close(code=4001)
        return

    # 2. إدارة الاتصال عبر الـ manager الذي قمت ببنائه
    await ws_manager.connect(websocket, user_id)

    try:
        await websocket.send_json({"event": "connected", "user_id": user_id})
        # 3. حلقة الاستقبال (Keep-alive)
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"event": "pong"})

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
    except Exception as e:
        # هنا يمكنك تسجيل الخطأ باستخدام Logger بدلاً من print
        logger.debug(f"Error: {e}")
        ws_manager.disconnect(websocket, user_id)