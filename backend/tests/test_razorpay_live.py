"""
End-to-end tests for LIVE Razorpay payment integration (test mode).
Covers: /api/config, create-order, verify (tampered), verify (valid signature via HMAC),
demo verify rejection, application status transition, admin visibility, cleanup.
"""
import os
import io
import hmac
import hashlib
import uuid
import requests
import pytest

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://formease-preview.preview.emergentagent.com"
API = f"{BASE}/api"

RAZORPAY_KEY_ID = "rzp_test_TO39EamDLKLtWI"
RAZORPAY_KEY_SECRET = "3axc5D2hk1zhJ3cKCw2eXfua"

ADMIN_EMAIL = "gamingsteam2003@gmail.com"
ADMIN_PASSWORD = "FormEase@Admin123"


def _png_bytes():
    # 1x1 PNG
    import base64
    return base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    )


@pytest.fixture(scope="module")
def customer():
    s = requests.Session()
    email = f"test_rzp_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={
        "name": "Test Rzp User", "email": email, "phone": "9000000000", "password": "Passw0rd!123"
    })
    assert r.status_code in (200, 201), r.text
    return {"session": s, "email": email}


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return s


def test_config_reports_live_mode():
    r = requests.get(f"{API}/config")
    assert r.status_code == 200
    data = r.json()
    assert data.get("payments_mode") == "live", data


@pytest.fixture(scope="module")
def submitted_ready_app(customer):
    s = customer["session"]
    r = s.post(f"{API}/applications", json={"service_type": "learner"})
    assert r.status_code in (200, 201), r.text
    app = r.json()
    app_id = app["application_id"]

    payload = {
        "applicant_data": {
            "full_name": "Test Rzp User", "dob": "1995-06-15", "gender": "Male",
            "mobile": "9000000000", "email": customer["email"],
            "address": "123 Test Street", "city": "Bengaluru", "state": "Karnataka", "pin": "560001",
            "vehicle_category": "LMV (Car / Light Motor Vehicle)", "blood_group": "O+",
            "rto_city": "Bengaluru South", "qualification": "12th Pass",
        }
    }
    r = s.patch(f"{API}/applications/{app_id}", json=payload)
    assert r.status_code == 200, r.text

    # Upload the 3 required documents
    for doc_type in ("age_proof", "address_proof", "photograph"):
        files = {"file": (f"{doc_type}.png", _png_bytes(), "image/png")}
        data = {"application_id": app_id, "doc_type": doc_type}
        r = s.post(f"{API}/documents/upload", data=data, files=files)
        assert r.status_code in (200, 201), f"{doc_type}: {r.status_code} {r.text}"

    return {"application_id": app_id, "session": s, "email": customer["email"]}


def test_create_order_returns_live_order(submitted_ready_app):
    s = submitted_ready_app["session"]
    app_id = submitted_ready_app["application_id"]
    r = s.post(f"{API}/payments/create-order", json={"application_id": app_id})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["mode"] == "live", d
    assert d["amount"] == 25000
    assert d["currency"] == "INR"
    assert d["key_id"] == RAZORPAY_KEY_ID
    assert d["order_id"].startswith("order_"), d["order_id"]
    assert not d["order_id"].startswith("order_demo_"), "Should be a real Razorpay order id"
    submitted_ready_app["order_id"] = d["order_id"]


def test_verify_demo_rejected_in_live_mode(submitted_ready_app):
    s = submitted_ready_app["session"]
    r = s.post(f"{API}/payments/verify", json={
        "application_id": submitted_ready_app["application_id"],
        "order_id": submitted_ready_app.get("order_id", "order_x"),
        "demo": True,
    })
    assert r.status_code == 400, r.text


def test_verify_tampered_signature_rejected(submitted_ready_app):
    s = submitted_ready_app["session"]
    r = s.post(f"{API}/payments/verify", json={
        "application_id": submitted_ready_app["application_id"],
        "razorpay_order_id": submitted_ready_app["order_id"],
        "razorpay_payment_id": "pay_fake123",
        "razorpay_signature": "0" * 64,
    })
    assert r.status_code == 400, r.text
    # Application must still be in draft/not paid
    apps = s.get(f"{API}/applications/mine").json()
    a = next(x for x in apps if x["application_id"] == submitted_ready_app["application_id"])
    assert a["payment_status"] != "paid"
    assert a["status"] != "submitted"


def test_verify_valid_signature_marks_submitted(submitted_ready_app):
    s = submitted_ready_app["session"]
    order_id = submitted_ready_app["order_id"]
    payment_id = f"pay_{uuid.uuid4().hex[:14]}"
    # Compute signature the way Razorpay checkout would
    msg = f"{order_id}|{payment_id}".encode()
    sig = hmac.new(RAZORPAY_KEY_SECRET.encode(), msg, hashlib.sha256).hexdigest()

    r = s.post(f"{API}/payments/verify", json={
        "application_id": submitted_ready_app["application_id"],
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_id,
        "razorpay_signature": sig,
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("ok") is True
    app = body["application"]
    assert app["status"] == "submitted"
    assert app["payment_status"] == "paid"
    submitted_ready_app["payment_id"] = payment_id


def test_dashboard_shows_paid_application(submitted_ready_app):
    s = submitted_ready_app["session"]
    r = s.get(f"{API}/applications/mine")
    assert r.status_code == 200
    apps = r.json()
    a = next((x for x in apps if x["application_id"] == submitted_ready_app["application_id"]), None)
    assert a is not None
    assert a["payment_status"] == "paid"
    assert a["status"] == "submitted"


def test_admin_sees_paid_application(admin, submitted_ready_app):
    r = admin.get(f"{API}/admin/applications")
    assert r.status_code == 200
    apps = r.json()
    target_id = submitted_ready_app["application_id"]
    a = next((x for x in apps if x["application_id"] == target_id), None)
    assert a is not None, f"Admin did not see app {target_id}"
    assert a["payment_status"] == "paid"


def test_cleanup(admin, submitted_ready_app, customer):
    """Best-effort cleanup: remove test user, application, and payment records via direct DB."""
    app_id = submitted_ready_app["application_id"]
    email = customer["email"]
    try:
        from pymongo import MongoClient
        mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.environ.get("DB_NAME", "test_database")
        client = MongoClient(mongo_url)
        db = client[db_name]
        pr = db.payments.delete_many({"application_id": app_id})
        ar = db.applications.delete_many({"application_id": app_id})
        ur = db.users.delete_many({"email": email})
        sr = db.user_sessions.delete_many({"email": email})
        print(f"Cleanup: payments={pr.deleted_count} applications={ar.deleted_count} "
              f"users={ur.deleted_count} sessions={sr.deleted_count}")
        client.close()
    except Exception as e:
        print(f"Cleanup skipped: {e}")
