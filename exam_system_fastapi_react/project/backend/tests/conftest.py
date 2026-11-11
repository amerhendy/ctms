import os
import tempfile

import pytest


@pytest.fixture(scope="session", autouse=True)
def _test_env():
    """توجيه قاعدة البيانات لملف مؤقت معزول قبل استيراد التطبيق، حتى لا
    تتأثر بيانات التطوير الفعلية أثناء تشغيل الاختبارات."""
    tmp_dir = tempfile.mkdtemp()
    os.environ["SQLITE_DB_PATH"] = os.path.join(tmp_dir, "test.db")
    os.environ["UPLOADS_DIR"] = os.path.join(tmp_dir, "uploads")
    os.environ["REPORTS_DIR"] = os.path.join(tmp_dir, "uploads", "reports")
    os.environ["ADMIN_DEFAULT_USERNAME"] = "admin"
    os.environ["ADMIN_DEFAULT_PASSWORD"] = "admin123"
    yield


@pytest.fixture()
def client():
    from fastapi.testclient import TestClient

    from main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture()
def admin_token(client):
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200
    return r.json()["token"]


@pytest.fixture()
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
