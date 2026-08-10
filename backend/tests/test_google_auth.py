"""Google sign-in (Emergent-managed) tests.

Since no real Google account is available, we exercise:
- POST /api/auth/google/session guards (missing + bogus session_id)
- Server-side session injection into user_sessions collection, then verify
  session_token works both as Bearer header and cookie against /api/auth/me
- Logout invalidates JWT cookie session -> /auth/me 401
"""
import os
import time
import uuid
import requests
import pytest
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://formease-preview.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "gamingsteam2003@gmail.com"
ADMIN_PASSWORD = "FormEase@Admin123"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


@pytest.fixture(scope="module")
def mongo_db():
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]


@pytest.fixture(scope="module")
def injected_session(mongo_db):
    """Insert a fake user_sessions row for the admin user and yield token."""
    user = mongo_db.users.find_one({"email": ADMIN_EMAIL})
    assert user, f"Admin user {ADMIN_EMAIL} not found in {DB_NAME}.users"
    token = f"test_session_{uuid.uuid4().hex}"
    mongo_db.user_sessions.insert_one({
        "user_id": str(user["_id"]),
        "session_token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    yield token
    mongo_db.user_sessions.delete_one({"session_token": token})


class TestGoogleSessionEndpointGuards:
    def test_empty_body_returns_400(self):
        r = requests.post(f"{API}/auth/google/session", json={})
        assert r.status_code == 400, r.text

    def test_missing_session_id_returns_400(self):
        r = requests.post(f"{API}/auth/google/session", json={"session_id": ""})
        assert r.status_code == 400, r.text

    def test_bogus_session_id_returns_401(self):
        r = requests.post(f"{API}/auth/google/session",
                          json={"session_id": f"bogus_{uuid.uuid4().hex}"})
        assert r.status_code == 401, r.text


class TestInjectedSessionAuth:
    def test_bearer_session_token_authenticates(self, injected_session):
        r = requests.get(f"{API}/auth/me",
                         headers={"Authorization": f"Bearer {injected_session}"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"

    def test_cookie_session_token_authenticates(self, injected_session):
        s = requests.Session()
        # Set cookie for backend domain
        from urllib.parse import urlparse
        host = urlparse(BASE_URL).hostname
        s.cookies.set("session_token", injected_session, domain=host, path="/")
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 200, r.text
        assert r.json()["email"] == ADMIN_EMAIL

    def test_bogus_bearer_session_returns_401(self):
        r = requests.get(f"{API}/auth/me",
                         headers={"Authorization": "Bearer not_a_real_session_xyz"})
        assert r.status_code == 401


class TestJwtLogoutRegression:
    def test_jwt_login_then_logout_invalidates(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login",
                   json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        assert r.json()["role"] == "admin"
        # authed
        assert s.get(f"{API}/auth/me").status_code == 200
        # logout
        assert s.post(f"{API}/auth/logout").status_code == 200
        # cookies should be cleared -> 401
        s2 = requests.Session()
        assert s2.get(f"{API}/auth/me").status_code == 401


class TestAuthGuardRedirects:
    """Backend contract: protected endpoints return 401 unauthenticated."""
    def test_dashboard_apis_require_auth(self):
        # /applications/mine is called by dashboard
        r = requests.get(f"{API}/applications/mine")
        assert r.status_code == 401

    def test_admin_stats_requires_auth(self):
        r = requests.get(f"{API}/admin/stats")
        assert r.status_code == 401
