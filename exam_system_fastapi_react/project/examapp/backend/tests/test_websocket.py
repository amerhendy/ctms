import pytest
from fastapi.testclient import TestClient
from main import app  # استورد تطبيق FastAPI الخاص بك

client = TestClient(app)

# 🟢 1. اختبار الاتصال بدون توكن (يجب أن يفشل ويرجع كود 1008)
def test_websocket_missing_token():
    with pytest.raises(Exception):
        with client.websocket_connect("/ws") as websocket:
            pass

# 🟢 2. اختبار الاتصال بتوكن غير صالح
def test_websocket_invalid_token():
    with pytest.raises(Exception):
        with client.websocket_connect("/ws?token=invalid_token_123") as websocket:
            pass

# 🟢 3. اختبار الاتصال بتوكن صحيح وتبادل الرسائل (Ping / Pong)
def test_websocket_success(valid_student_token):
    # افتراض أن valid_student_token يحوي توكن صحيح لمستخدم عادي
    with client.websocket_connect(f"/ws?token={valid_student_token}") as websocket:
        # 1. استقبال رسالة الترحيب الأولى
        data = websocket.receive_json()
        assert data["event"] == "connected"
        assert "user_id" in data
        assert data["is_admin"] is False

        # 2. إرسال "ping" والتحقق من الـ "pong"
        websocket.send_text("ping")
        response = websocket.receive_json()
        assert response == {"event": "pong"}

# 🟢 4. اختبار اتصال الأدمن والتحقق من الصلاحية
def test_websocket_admin_success(valid_admin_token):
    with client.websocket_connect(f"/ws?token={valid_admin_token}") as websocket:
        data = websocket.receive_json()
        assert data["event"] == "connected"
        assert data["is_admin"] is True



const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZ…3MifQ.VqiaYzvz2xJ30fWDVRZnFWFkUGLbZVHJ2DQuej84MKQ";
const ws = new WebSocket(`ws://localhost:5050/ws?token=${token}`);
// الاستماع عند فتح الاتصال
ws.onopen = () => console.log("Connected!");

// الاستماع للرسائل القادمة من FastAPI
ws.onmessage = (event) => {
    console.log("Received:", JSON.parse(event.data));
};

// الاستماع للإغلاق
ws.onclose = (event) => console.log("Closed:", event.code, event.reason);