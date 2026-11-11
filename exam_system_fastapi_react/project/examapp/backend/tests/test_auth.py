def test_admin_login_success(client):
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200
    data = r.json()
    assert "token" in data
    assert data["admin"]["username"] == "admin"


def test_admin_login_wrong_password(client):
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "wrong"})
    assert r.status_code == 401


def test_protected_route_requires_auth(client):
    r = client.get("/api/v1/job-models")
    assert r.status_code == 401


def test_me_endpoint(client, admin_headers):
    r = client.get("/api/v1/auth/me", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["username"] == "admin"


def test_logout(client, admin_headers):
    r = client.post("/api/v1/auth/logout", headers=admin_headers)
    assert r.status_code == 200
    r2 = client.get("/api/v1/auth/me", headers=admin_headers)
    assert r2.status_code == 401
