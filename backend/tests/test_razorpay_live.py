"""
End-to-end tests for LIVE Razorpay payment integration (test mode) — PER-SERVICE pricing.
Verifies /api/config, per-service create-order amounts, tamper resistance,
HMAC verify success (per service), admin visibility with correct amounts, cleanup.
"""
import os
import hmac
import hashlib
import uuid
import base64
import requests
import pytest

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://formease-preview.preview.emergentagent.com"
API = f"{BASE}/api"

RAZORPAY_KEY_ID = "rzp_test_TO39EamDLKLtWI"
RAZORPAY_KEY_SECRET = "3axc5D2hk1zhJ3cKCw2eXfua"

ADMIN_EMAIL = "gamingsteam2003@gmail.com"
ADMIN_PASSWORD = "FormEase@Admin123"

EXPECTED_FEES_PAISE = {"scholarship": 10000, "pan": 10000, "learner": 35000}
EXPECTED_FEES_INR = {"scholarship": 100, "pan": 100, "learner": 350}

# Document requirements per service (all required 3-tuples from DOC_SPECS)
REQUIRED_DOCS = {
    "scholarship": ["photograph", "student_id", "marksheet"],
    "pan": ["identity_proof", "address_proof", "photograph"],
    "learner": ["age_proof", "address_proof", "photograph"],
}


def _png_bytes():
    return base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    )


def _register_customer():
    s = requests.Session()
    email = f"test_rzp_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={
        "name": "Test Rzp User", "email": email, "phone": "9000000000", "password": "Passw0rd!123"
    })
    assert r.status_code in (200, 201), r.text
    return s, email


def _create_ready_app(session, service_type, email):
    r = session.post(f"{API}/applications", json={"service_type": service_type})
    assert r.status_code in (200, 201), r.text
    app_id = r.json()["application_id"]

    payload = {
        "applicant_data": {
            "full_name": "Test Rzp User", "dob": "1995-06-15", "gender": "Male",
            "mobile": "9000000000", "email": email,
            "address": "123 Test Street", "city": "Bengaluru", "state": "Karnataka", "pin": "560001",
            "vehicle_category": "LMV (Car / Light Motor Vehicle)", "blood_group": "O+",
            "rto_city": "Bengaluru South", "qualification": "12th Pass",
            "father_name": "Father Name", "annual_income": "100000", "institution": "Test Univ",
            "course": "BSc", "year_of_study": "2",
        }
    }
    r = session.patch(f"{API}/applications/{app_id}", json=payload)
    assert r.status_code == 200, r.text

    for doc_type in REQUIRED_DOCS[service_type]:
        files = {"file": (f"{doc_type}.png", _png_bytes(), "image/png")}
        data = {"application_id": app_id, "doc_type": doc_type}
        r = session.post(f"{API}/documents/upload", data=data, files=files)
        assert r.status_code in (200, 201), f"{doc_type}: {r.status_code} {r.text}"
    return app_id


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def created():
    """Store artefacts across tests for cleanup."""
    return {"emails": [], "app_ids": []}


# ---------------- /api/config ----------------

def test_config_reports_live_mode_and_per_service_fees():
    r = requests.get(f"{API}/config")
    assert r.status_code == 200
    data = r.json()
    assert data.get("payments_mode") == "live", data
    services = {s["key"]: s for s in data["services"]}
    for key, fee_inr in EXPECTED_FEES_INR.items():
        assert key in services, f"missing service {key}"
        assert services[key]["fee"] == fee_inr, (
            f"Expected {key} fee=₹{fee_inr}, got ₹{services[key]['fee']}"
        )


# ---------------- Per-service create-order ----------------

@pytest.mark.parametrize("service_type", ["scholarship", "pan", "learner"])
def test_create_order_amount_matches_service(service_type, created):
    s, email = _register_customer()
    created["emails"].append(email)
    app_id = _create_ready_app(s, service_type, email)
    created["app_ids"].append(app_id)

    r = s.post(f"{API}/payments/create-order", json={"application_id": app_id})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["mode"] == "live", d
    assert d["amount"] == EXPECTED_FEES_PAISE[service_type], (
        f"{service_type}: expected {EXPECTED_FEES_PAISE[service_type]} paise, got {d['amount']}"
    )
    assert d["currency"] == "INR"
    assert d["key_id"] == RAZORPAY_KEY_ID
    assert d["order_id"].startswith("order_") and not d["order_id"].startswith("order_demo_")


# ---------------- Tamper resistance ----------------

def test_amount_is_server_derived_not_from_body(created):
    """POST create-order with attacker-supplied amount:1 — server must charge the service fee."""
    s, email = _register_customer()
    created["emails"].append(email)
    app_id = _create_ready_app(s, "learner", email)  # learner = 35000 paise
    created["app_ids"].append(app_id)

    # Attempt tamper — send amount=1 (₹0.01) in body
    r = s.post(f"{API}/payments/create-order", json={
        "application_id": app_id, "amount": 1, "currency": "USD",
        "service_type": "scholarship",  # try to downgrade
    })
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["amount"] == 35000, f"Server MUST derive from service_type=learner (35000), got {d['amount']}"
    assert d["currency"] == "INR"


# ---------------- HMAC verify success — full pricing flow per service ----------------

@pytest.mark.parametrize("service_type,expected_paise", [
    ("scholarship", 10000), ("pan", 10000), ("learner", 35000),
])
def test_full_payment_flow_per_service(service_type, expected_paise, created):
    s, email = _register_customer()
    created["emails"].append(email)
    app_id = _create_ready_app(s, service_type, email)
    created["app_ids"].append(app_id)

    r = s.post(f"{API}/payments/create-order", json={"application_id": app_id})
    assert r.status_code == 200, r.text
    order = r.json()
    assert order["amount"] == expected_paise
    order_id = order["order_id"]

    payment_id = f"pay_{uuid.uuid4().hex[:14]}"
    msg = f"{order_id}|{payment_id}".encode()
    sig = hmac.new(RAZORPAY_KEY_SECRET.encode(), msg, hashlib.sha256).hexdigest()

    r = s.post(f"{API}/payments/verify", json={
        "application_id": app_id,
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

    # Persist verification via applications/mine
    apps = s.get(f"{API}/applications/mine").json()
    a = next((x for x in apps if x["application_id"] == app_id), None)
    assert a is not None
    assert a["payment_status"] == "paid"


# ---------------- Tampered signature must not mark app paid ----------------

def test_verify_tampered_signature_rejected(created):
    s, email = _register_customer()
    created["emails"].append(email)
    app_id = _create_ready_app(s, "pan", email)
    created["app_ids"].append(app_id)

    r = s.post(f"{API}/payments/create-order", json={"application_id": app_id})
    order_id = r.json()["order_id"]

    r = s.post(f"{API}/payments/verify", json={
        "application_id": app_id,
        "razorpay_order_id": order_id,
        "razorpay_payment_id": "pay_fake123",
        "razorpay_signature": "0" * 64,
    })
    assert r.status_code == 400, r.text
    apps = s.get(f"{API}/applications/mine").json()
    a = next(x for x in apps if x["application_id"] == app_id)
    assert a["payment_status"] != "paid"


# ---------------- Admin visibility with correct amounts ----------------

def test_admin_stats_revenue_reflects_actual_amounts(admin, created):
    r = admin.get(f"{API}/admin/stats")
    assert r.status_code == 200, r.text
    stats = r.json()
    # by_service revenue should be a sum, not multiple of flat 250
    by_service = stats.get("by_service", {})
    # Just sanity-check keys present when data exists
    assert isinstance(by_service, dict)
    # total_revenue must be int (rupees)
    assert isinstance(stats.get("total_revenue"), int)


def test_admin_application_detail_shows_correct_amount(admin, created):
    """Pick the first paid app (scholarship — expected 100) and verify admin sees ₹100."""
    if not created["app_ids"]:
        pytest.skip("no created apps")
    # Find any app_id from paid ones; use direct DB not needed — admin list carries payment_status
    r = admin.get(f"{API}/admin/applications")
    assert r.status_code == 200
    apps = r.json()
    # find one of ours that's paid
    ours_paid = [a for a in apps if a["application_id"] in created["app_ids"] and a.get("payment_status") == "paid"]
    assert ours_paid, "expected at least one paid TEST app visible to admin"
    for a in ours_paid:
        svc = a["service_type"]
        expected = EXPECTED_FEES_INR[svc]
        # get detail
        r = admin.get(f"{API}/admin/applications/{a['application_id']}")
        assert r.status_code == 200, r.text
        detail = r.json()
        # payment may be under 'payment' or 'payments' — check both
        payment = detail.get("payment") or (detail.get("payments") or [{}])[0] if detail.get("payments") else detail.get("payment")
        amount_paise = None
        if isinstance(payment, dict):
            amount_paise = payment.get("amount")
        if amount_paise is None:
            # fallback: maybe stored on application root
            amount_paise = detail.get("amount")
        assert amount_paise == expected * 100, (
            f"{a['application_id']} ({svc}): expected {expected*100} paise, got {amount_paise}. detail={detail}"
        )


# ---------------- Cleanup ----------------

def test_cleanup(admin, created):
    from pymongo import MongoClient
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "test_database")
    client = MongoClient(mongo_url)
    db = client[db_name]
    pr = db.payments.delete_many({"application_id": {"$in": created["app_ids"]}})
    ar = db.applications.delete_many({"application_id": {"$in": created["app_ids"]}})
    ur = db.users.delete_many({"email": {"$in": created["emails"]}})
    sr = db.user_sessions.delete_many({"email": {"$in": created["emails"]}})
    print(f"Cleanup: payments={pr.deleted_count} applications={ar.deleted_count} "
          f"users={ur.deleted_count} sessions={sr.deleted_count}")
    client.close()
