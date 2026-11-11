from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from core.config import settings
from services.ws_manager import ws_manager
from core.deps import decode_token
import logging
logger = logging.getLogger(__name__)

from api.v1.endpoints import applicants, auth, exam, job_models, questions
from api.v1.endpoints.auth import router as auth_router
from api.v1.endpoints.job_models import router as job_models_router
from api.v1.endpoints.applicants import router as application_router
from api.v1.endpoints.questions import router as questions_router
from api.v1.endpoints.exam import router as exam_router
api_router = APIRouter(prefix=settings.API_V1_PREFIX)
api_router.include_router(auth_router)
api_router.include_router(job_models_router)
api_router.include_router(application_router)
api_router.include_router(questions_router)
api_router.include_router(exam_router)

wsrouter = APIRouter()
@wsrouter.get("/ws")
async def websocket_info():
    """
    ### 🔌 WebSocket Info Endpoint
    
    - **URL:** `http://localhost:5051/ws`
    - **Description:** Endpoint to provide information about the WebSocket connection.
    - **Query Parameters:**
      - `token` (str, optional): JWT token for authentication. If provided, the server will validate it and return the user's role.
    
    - **Response:**
      - `message` (str): A message indicating the status of the WebSocket connection.
      - `role` (str, optional): The role of the user if a valid token is provided.
    
    - **Example Request:**
      ```
      GET /ws?token=YOUR_JWT_TOKEN
      ```
    - **Example Response:**
      ```json
      {
          "message": "WebSocket connection is available. Use the /ws endpoint to connect.",
          "role": "admin"
      }      ```
    """
    return {"message": "WebSocket connection is available. Use the /ws endpoint to connect."}
@wsrouter.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(None),
):
    """
    ### 🔌 WebSocket Connection Endpoint
    
    - **URL:** `ws://localhost:5051/ws?token=YOUR_JWT_TOKEN`
    - **Events Received:**
      - `connected`: عند نجاح الاتصال
      - `new_violation`: عند تسجيل مخالفة جديدة (للأدمن فقط)
      - `pong`: رد على رسالة `ping`
    """
    # 1. التحقق من التوكن واستخراج الدور (Role)
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload =await decode_token(token)
        user_id = payload.get("sub")
        role = payload.get("role", "student") # 🟢 جلب دور المستخدم
        is_admin = role in ["admin", "superadmin"]
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. إدارة الاتصال
    await ws_manager.connect(websocket, user_id, is_admin=True)

    try:
        await websocket.send_json({"event": "connected", "user_id": user_id, "is_admin": is_admin})
        
        # 3. حلقة الاستقبال (Keep-alive)
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"event": "pong"})

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket, user_id)

api_router.include_router(wsrouter)