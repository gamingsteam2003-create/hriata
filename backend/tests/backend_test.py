"""FormEase backend API pytest suite.

Covers: auth (register/login/logout/me/forgot/reset), applications wizard flow,
documents upload rejection/success, demo payments create+verify, public tracking,
admin stats/analytics/notifications/apps/status/notes/doc actions, security (RBAC + auth).
"""
import io
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://formease-preview.preview.emergentagent.com"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "gamingsteam2003@gmail.com"
ADMIN_PASSWORD = "FormEase@Admin123"
DEMO_EMAIL = "demo@formease.in"
DEMO_PASSWORD = "Demo@12345"


def _session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_sess():
    s = _session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    assert r.json()["role"] == "admin"
    return s


@pytest.fixture(scope="session")
def demo_sess():
    s = _session()
    r = s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="session")
def new_user_sess():
    """Register a fresh customer for isolated wizard tests."""
    s = _session()
    email = f"test_user_{uuid.uuid4().hex[:8]}@formease.in"
    r = s.post(f"{API}/auth/register", json={
        "name": "Test User", "email": email, "phone": "9876500000", "password": "TestPass@123"
    })
    assert r.status_code == 200, r.text
    s.email = email  # attach for later
    return s


# ---------------- Health / Config ----------------
class TestConfig:
    def test_root(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("demo_mode") is True

    def test_public_config(self):
        r = requests.get(f"{API}/config")
        assert r.status_code == 200
        data = r.json()
        assert data["payments_mode"] == "demo"
        assert data["demo_mode"] is True
        keys = {s["key"] for s in data["services"]}
        assert keys == {"scholarship", "pan", "learner"}
        for s in data["services"]:
            assert s["fee"] == 250
        assert "pan" in data["doc_specs"]


# ---------------- Auth ----------------
class TestAuth:
    def test_register_validation_short_password(self):
        r = requests.post(f"{API}/auth/register", json={
            "name": "X", "email": f"TEST_x_{uuid.uuid4().hex[:6]}@t.com", "phone": "9876543210", "password": "short"
        })
        assert r.status_code == 400

    def test_register_validation_bad_phone(self):
        r = requests.post(f"{API}/auth/register", json={
            "name": "X", "email": f"TEST_x_{uuid.uuid4().hex[:6]}@t.com", "phone": "123", "password": "GoodPass1!"
        })
        assert r.status_code == 400

    def test_register_login_logout_me(self):
        s = _session()
        email = f"TEST_lc_{uuid.uuid4().hex[:6]}@t.com"
        r = s.post(f"{API}/auth/register", json={
            "name": "LC", "email": email, "phone": "9876543210", "password": "GoodPass1!"
        })
        assert r.status_code == 200
        assert r.json()["email"] == email.lower()
        # me works via cookies
        me = s.get(f"{API}/auth/me")
        assert me.status_code == 200
        # logout
        assert s.post(f"{API}/auth/logout").status_code == 200
        assert s.get(f"{API}/auth/me").status_code == 401
        # login again
        r = s.post(f"{API}/auth/login", json={"email": email, "password": "GoodPass1!"})
        assert r.status_code == 200

    def test_login_bad_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "wrong-wrong"})
        assert r.status_code == 401

    def test_admin_login_role(self, admin_sess):
        me = admin_sess.get(f"{API}/auth/me")
        assert me.status_code == 200
        assert me.json()["role"] == "admin"

    def test_forgot_and_reset(self):
        s = _session()
        email = f"TEST_fp_{uuid.uuid4().hex[:6]}@t.com"
        s.post(f"{API}/auth/register", json={
            "name": "FP", "email": email, "phone": "9876543210", "password": "GoodPass1!"
        })
        r = s.post(f"{API}/auth/forgot-password", json={"email": email})
        assert r.status_code == 200
        link = r.json().get("dev_reset_link")
        assert link and "token=" in link
        token = link.split("token=")[1]
        r = requests.post(f"{API}/auth/reset-password", json={"token": token, "password": "NewPass@123"})
        assert r.status_code == 200
        r = requests.post(f"{API}/auth/login", json={"email": email, "password": "NewPass@123"})
        assert r.status_code == 200


# ---------------- Application wizard + documents + demo payment ----------------
class TestApplicationFlow:
    def test_full_pan_flow(self, new_user_sess):
        s = new_user_sess
        # step: create draft
        r = s.post(f"{API}/applications", json={"service_type": "pan"})
        assert r.status_code == 200
        app = r.json()
        app_id = app["application_id"]
        assert app_id.startswith("FE-")
        assert app["status"] == "draft"

        # step 1-2: patch applicant data
        r = s.patch(f"{API}/applications/{app_id}", json={"applicant_data": {
            "full_name": "Test User", "mobile": "9876500000", "email": "test@t.com",
            "dob": "2000-01-01", "father_name": "F", "address": "A", "pincode": "560001"
        }})
        assert r.status_code == 200

        # step 3: doc uploads — wrong ext rejected
        s2 = requests.Session()
        s2.cookies = s.cookies
        bad = s2.post(f"{API}/documents/upload",
                      data={"application_id": app_id, "doc_type": "identity_proof"},
                      files={"file": ("evil.exe", b"MZbinary", "application/octet-stream")})
        assert bad.status_code == 400

        # unknown doc_type rejected
        unk = s2.post(f"{API}/documents/upload",
                      data={"application_id": app_id, "doc_type": "unknown_xyz"},
                      files={"file": ("a.pdf", b"%PDF-1.4 hi", "application/pdf")})
        assert unk.status_code == 400

        # required uploads
        for key in ("identity_proof", "address_proof", "photograph"):
            r = s2.post(f"{API}/documents/upload",
                        data={"application_id": app_id, "doc_type": key},
                        files={"file": (f"{key}.pdf", b"%PDF-1.4\n" + b"x" * 200, "application/pdf")})
            assert r.status_code == 200, r.text
            assert any(d["doc_type"] == key for d in r.json()["documents"])

        # step 5: create demo order
        r = s.post(f"{API}/payments/create-order", json={"application_id": app_id})
        assert r.status_code == 200
        order = r.json()
        assert order["mode"] == "demo"
        assert order["amount"] == 25000

        # verify demo payment
        r = s.post(f"{API}/payments/verify", json={
            "application_id": app_id, "order_id": order["order_id"], "demo": True
        })
        assert r.status_code == 200, r.text
        assert r.json()["application"]["status"] == "submitted"
        assert r.json()["application"]["payment_status"] == "paid"

        # cannot edit after submit
        r = s.patch(f"{API}/applications/{app_id}", json={"applicant_data": {"full_name": "New"}})
        assert r.status_code == 400

        # mine list contains it
        r = s.get(f"{API}/applications/mine")
        assert r.status_code == 200
        assert any(a["application_id"] == app_id for a in r.json())

        # public tracking works
        r = requests.get(f"{API}/applications/track/{app_id}")
        assert r.status_code == 200
        t = r.json()
        assert t["application_id"] == app_id
        assert t["payment_status"] == "paid"
        assert t["status"] == "submitted"
        assert len(t["timeline"]) >= 2

        # save for admin tests
        pytest.shared_app_id = app_id
        pytest.shared_cookies = s.cookies

    def test_track_invalid(self):
        r = requests.get(f"{API}/applications/track/FE-0000-99999")
        assert r.status_code == 404

    def test_create_order_missing_docs(self, admin_sess):
        # Fresh user creates draft with no docs -> create-order should 400
        s = _session()
        email = f"TEST_nd_{uuid.uuid4().hex[:6]}@t.com"
        s.post(f"{API}/auth/register", json={
            "name": "ND", "email": email, "phone": "9876543210", "password": "GoodPass1!"
        })
        r = s.post(f"{API}/applications", json={"service_type": "pan"})
        app_id = r.json()["application_id"]
        r = s.post(f"{API}/payments/create-order", json={"application_id": app_id})
        assert r.status_code == 400


# ---------------- Security ----------------
class TestSecurity:
    def test_admin_endpoints_require_admin(self, demo_sess):
        r = demo_sess.get(f"{API}/admin/stats")
        assert r.status_code == 403
        r = demo_sess.get(f"{API}/admin/applications")
        assert r.status_code == 403

    def test_admin_endpoints_require_auth(self):
        r = requests.get(f"{API}/admin/stats")
        assert r.status_code == 401

    def test_cross_user_application_access_forbidden(self, demo_sess):
        # try to access the app just created by new_user_sess
        app_id = getattr(pytest, "shared_app_id", None)
        if not app_id:
            pytest.skip("no shared app id")
        r = demo_sess.get(f"{API}/applications/{app_id}")
        assert r.status_code == 403

    def test_document_url_unauthenticated_401(self):
        r = requests.get(f"{API}/documents/FE-2026-00001/somefile.pdf")
        assert r.status_code == 401


# ---------------- Admin ----------------
class TestAdmin:
    def test_stats(self, admin_sess):
        r = admin_sess.get(f"{API}/admin/stats")
        assert r.status_code == 200
        data = r.json()
        for k in ("total_applications", "total_revenue", "by_service", "demo_mode"):
            assert k in data
        assert data["total_applications"] >= 1
        assert data["total_revenue"] >= 250

    def test_analytics_charts(self, admin_sess):
        r = admin_sess.get(f"{API}/admin/analytics")
        assert r.status_code == 200
        data = r.json()
        assert len(data["apps_over_time"]) == 30
        assert len(data["revenue_over_time"]) == 30
        assert isinstance(data["by_service"], list)
        assert isinstance(data["status_distribution"], list)

    def test_notifications(self, admin_sess):
        r = admin_sess.get(f"{API}/admin/notifications")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_applications_filter_and_search(self, admin_sess):
        r = admin_sess.get(f"{API}/admin/applications")
        assert r.status_code == 200
        all_apps = r.json()
        assert len(all_apps) >= 1
        # search
        target = getattr(pytest, "shared_app_id", all_apps[0]["application_id"])
        r = admin_sess.get(f"{API}/admin/applications", params={"search": target})
        assert r.status_code == 200
        assert any(a["application_id"] == target for a in r.json())
        # service filter
        r = admin_sess.get(f"{API}/admin/applications", params={"service": "pan"})
        assert r.status_code == 200
        assert all(a["service_type"] == "pan" for a in r.json())
        # status filter
        r = admin_sess.get(f"{API}/admin/applications", params={"status": "submitted"})
        assert r.status_code == 200
        assert all(a["status"] == "submitted" for a in r.json())

    def test_admin_detail_and_actions(self, admin_sess):
        app_id = getattr(pytest, "shared_app_id", None)
        if not app_id:
            pytest.skip("no shared app id")
        # detail
        r = admin_sess.get(f"{API}/admin/applications/{app_id}")
        assert r.status_code == 200
        detail = r.json()
        assert detail["customer"]["email"]
        assert detail["payment"]["status"] == "paid"

        # verify a document
        r = admin_sess.patch(f"{API}/admin/applications/{app_id}/documents/identity_proof",
                              json={"action": "verify"})
        assert r.status_code == 200
        assert any(d["doc_type"] == "identity_proof" and d["verified"] for d in r.json()["documents"])

        # request replacement on another
        r = admin_sess.patch(f"{API}/admin/applications/{app_id}/documents/address_proof",
                              json={"action": "request_replacement"})
        assert r.status_code == 200
        upd = r.json()
        assert upd["status"] == "need_more_info"
        assert any(d["doc_type"] == "address_proof" and d["replacement_requested"] for d in upd["documents"])

        # add private note
        r = admin_sess.post(f"{API}/admin/applications/{app_id}/notes",
                             json={"note": "internal note"})
        assert r.status_code == 200

        # status change: processing -> completed
        r = admin_sess.patch(f"{API}/admin/applications/{app_id}/status", json={"status": "processing"})
        assert r.status_code == 200
        assert r.json()["status"] == "processing"

        r = admin_sess.patch(f"{API}/admin/applications/{app_id}/status", json={"status": "completed"})
        assert r.status_code == 200
        assert r.json()["status"] == "completed"

        # public tracking reflects update
        r = requests.get(f"{API}/applications/track/{app_id}")
        assert r.status_code == 200
        assert r.json()["status"] == "completed"

    def test_invalid_status(self, admin_sess):
        app_id = getattr(pytest, "shared_app_id", None)
        if not app_id:
            pytest.skip()
        r = admin_sess.patch(f"{API}/admin/applications/{app_id}/status", json={"status": "not_a_status"})
        assert r.status_code == 400
