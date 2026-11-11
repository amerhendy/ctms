# ws_manager.py
from typing import Dict, Set, Optional
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages active WebSocket connections separating Admins and standard Users."""

    def __init__(self):
        # user_id -> set of active WebSockets
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # set of active Admin WebSockets
        self.admin_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, user_id: int, is_admin: bool = False):
        await websocket.accept()
        
        # إضافة لقائمة المستخدمين العامة
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

        # 🟢 إذا كان أدمن، يتم إضافته لمجموعة الأدمن الخاصة بالتنبيهات
        if is_admin:
            self.admin_connections.add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        # إزالة من مجموعة الأدمن إن وجد
        self.admin_connections.discard(websocket)

        # إزالة من قائمة المستخدمين
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: int, data: dict):
        """Send JSON message to all connections of a specific user."""
        if user_id in self.active_connections:
            dead = set()
            for ws in list(self.active_connections[user_id]):
                try:
                    await ws.send_text(json.dumps(data, default=str))
                except Exception:
                    dead.add(ws)
            for ws in dead:
                self.disconnect(ws, user_id)

    async def broadcast_to_admins(self, data: dict):
        """🟢 Send violation alert ONLY to connected admins."""
        dead = set()

        for ws in list(self.admin_connections):
            try:
                await ws.send_text(json.dumps(data, default=str))
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.admin_connections.discard(ws)


ws_manager = ConnectionManager()