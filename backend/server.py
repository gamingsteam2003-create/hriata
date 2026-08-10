from dotenv import load_dotenv
load_dotenv()

import os
import re
import uuid
import logging
import secrets
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional

import bcrypt
import jwt
import razorpay
from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr

ROOT_DIR = Path(__file__).parent
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

logger = logging.getLogger("formease")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

JWT_ALGORITHM = "HS256"
SERVICE_FEE_PAISE = 25000
SERVICE_FEE_INR = 250
SERVICES = {
    "scholarship": "Scholarship Application",
    "pan": "PAN Card Application",
    "learner": "Learner's Licence",
}
DOC_SPECS = {
    "scholarship": [
        {"key": "photograph", "label": "Photograph", "required": True},
        {"key": "student_id", "label": "Student ID / Bonafide Certificate", "required": True},
        {"key": "marksheet", "label": "Academic Marksheet", "required": True},
        {"key": "income_certificate", "label": "Income Certificate", "required": False},
    ],
    "pan": [
        {"key": "identity_proof", "label": "Identity Proof", "required": True},
        {"key": "address_proof", "label": "Address Proof", "required": True},
        {"key": "photograph", "label": "Photograph", "required": True},
        {"key": "dob_proof", "label": "Date of Birth Proof", "required": False},
    ],
    "learner": [
        {"key": "age_proof", "label": "Age Proof", "required": True},
        {"key": "address_proof", "label": "Address Proof", "required": True},
        {"key": "photograph", "label": "Photograph", "required": True},
        {"key": "medical_certificate", "label": "Medical Certificate (Form 1A)", "required": False},
    ],
}
APP_STATUSES = ["draft", "submitted", "documents_under_review", "processing", "need_more_info", "completed"]
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".pdf"}
MAX_UPLOAD_BYTES = int(os.environ.get("MAX_UPLOAD_MB", "5")) * 1024 * 1024
DEMO_MODE = os.environ.get("DEMO_MODE", "true").lower() == "true"
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)) if (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) else None
PAYMENTS_LIVE = razorpay_client is not None

app = FastAPI(title="FormEase API")
api = APIRouter(prefix="/api")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def serialize(doc):
    if not doc:
        return doc
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


# ---------------- Auth ----------------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {"sub": user_id, "email": email, "role": role,
               "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, user_id: str, email: str, role: str):
    response.set_cookie("access_token", create_access_token(user_id, email, role),
                        httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie("refresh_token", create_refresh_token(user_id),
                        httponly=True, secure=True, samesite="none", max_age=604800, path="/")


def public_user(user: dict) -> dict:
    return {"id": str(user["_id"]), "name": user["name"], "email": user["email"],
            "phone": user.get("phone", ""), "role": user.get("role", "customer"),
            "created_at": user.get("created_at")}


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    from bson import ObjectId
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


class RegisterBody(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str


class LoginBody(BaseModel):
    email: EmailStr
    password: str


@api.post("/auth/register")
async def register(body: RegisterBody, response: Response):
    email = body.email.lower().strip()
    if len(body.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    if not re.fullmatch(r"\d{10}", body.phone.strip()):
        raise HTTPException(400, "Enter a valid 10-digit mobile number")
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "An account with this email already exists")
    doc = {"name": body.name.strip(), "email": email, "phone": body.phone.strip(),
           "password_hash": hash_password(body.password), "role": "customer", "created_at": now_iso()}
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    set_auth_cookies(response, str(result.inserted_id), email, "customer")
    return public_user(doc)


@api.post("/auth/login")
async def login(body: LoginBody, request: Request, response: Response):
    email = body.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and locked_until > now_iso():
            raise HTTPException(429, "Too many failed attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True)
        raise HTTPException(401, "Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    set_auth_cookies(response, str(user["_id"]), email, user.get("role", "customer"))
    return public_user(user)


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


@api.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(401, "No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid refresh token")
    from bson import ObjectId
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(401, "User not found")
    set_auth_cookies(response, str(user["_id"]), user["email"], user.get("role", "customer"))
    return {"ok": True}


@api.post("/auth/forgot-password")
async def forgot_password(body: dict):
    email = (body.get("email") or "").lower().strip()
    user = await db.users.find_one({"email": email})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token, "email": email,
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            "used": False, "created_at": now_iso()})
        reset_link = f"{os.environ.get('FRONTEND_URL', '')}/reset-password?token={token}"
        logger.info(f"Password reset link for {email}: {reset_link}")
        await send_notification("email", "password_reset", email,
                                f"Reset your FormEase password: {reset_link}")
        if DEMO_MODE:
            return {"ok": True, "dev_reset_link": reset_link}
    return {"ok": True}


@api.post("/auth/reset-password")
async def reset_password(body: dict):
    token = body.get("token", "")
    password = body.get("password", "")
    if len(password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    rec = await db.password_reset_tokens.find_one({"token": token, "used": False})
    if not rec or rec["expires_at"] < now_iso():
        raise HTTPException(400, "Reset link is invalid or expired")
    await db.users.update_one({"email": rec["email"]}, {"$set": {"password_hash": hash_password(password)}})
    await db.password_reset_tokens.update_one({"_id": rec["_id"]}, {"$set": {"used": True}})
    return {"ok": True}


# ---------------- Notifications (mock-ready architecture) ----------------

async def send_notification(channel: str, ntype: str, recipient: str, message: str, application_id: str = None):
    status = "mocked"
    if channel == "whatsapp" and os.environ.get("WHATSAPP_ACCESS_TOKEN") and os.environ.get("WHATSAPP_PHONE_NUMBER_ID"):
        try:
            import requests as req
            phone_id = os.environ["WHATSAPP_PHONE_NUMBER_ID"]
            r = req.post(
                f"https://graph.facebook.com/v19.0/{phone_id}/messages",
                headers={"Authorization": f"Bearer {os.environ['WHATSAPP_ACCESS_TOKEN']}"},
                json={"messaging_product": "whatsapp", "to": recipient.replace("+", "").replace(" ", ""),
                      "type": "text", "text": {"body": message}}, timeout=10)
            status = "sent" if r.ok else "failed"
        except Exception as e:
            logger.error(f"WhatsApp send failed: {e}")
            status = "failed"
    elif channel == "email" and os.environ.get("EMERGENT_EMAIL_KEY"):
        try:
            import httpx
            lines = message.split("\n")
            subject = lines[0][:120]
            body_html = "".join(
                f'<p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#334155">{line}</p>'
                for line in lines[1:] if line.strip())
            html = (
                '<div style="max-width:560px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px">'
                '<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:18px;font-weight:bold;color:#0A192F">FormEase</p>'
                + body_html +
                '<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>'
                '<p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#94a3b8">FormEase is an independent application assistance service and is not a government website or authority.</p></div>')
            async with httpx.AsyncClient(timeout=30) as http_client:
                r = await http_client.post(
                    "https://integrations.emergentagent.com/api/v1/email/send",
                    headers={"X-Email-Key": os.environ["EMERGENT_EMAIL_KEY"]},
                    json={"to": [recipient], "subject": subject, "html": html,
                          "from_name": os.environ.get("EMAIL_FROM_NAME", "FormEase"),
                          "contact_email": os.environ.get("ADMIN_NOTIFY_EMAIL", "")})
            status = "sent" if r.status_code in (200, 202) else "failed"
            if status == "failed":
                logger.error(f"Email send failed: {r.status_code} {r.text}")
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            status = "failed"
    await db.notifications.insert_one({
        "application_id": application_id, "type": ntype, "channel": channel,
        "recipient": recipient, "message": message, "status": status, "created_at": now_iso()})
    logger.info(f"[{channel.upper()}:{status}] to={recipient} :: {message[:120]}")


async def notify_new_application(app_doc: dict):
    name = app_doc.get("applicant_data", {}).get("full_name", "Customer")
    msg = (f"New FormEase Application\n"
           f"Application ID: {app_doc['application_id']}\n"
           f"Service: {SERVICES[app_doc['service_type']]}\n"
           f"Applicant: {name}\n"
           f"Amount: Rs.{SERVICE_FEE_INR}\n"
           f"Payment: Successful\n"
           f"Documents: {len(app_doc.get('documents', []))} uploaded\n"
           f"Status: New\n\nOpen Admin Dashboard.")
    await send_notification("whatsapp", "new_application_admin",
                            os.environ.get("ADMIN_WHATSAPP_NUMBER", ""), msg, app_doc["application_id"])
    await send_notification("email", "new_application_admin",
                            os.environ.get("ADMIN_NOTIFY_EMAIL", ""), msg, app_doc["application_id"])
    email = app_doc.get("applicant_data", {}).get("email")
    if email:
        await send_notification("email", "application_received_customer", email,
                                f"Application Received - {app_doc['application_id']}\n\n"
                                f"Dear {name},\nYour {SERVICES[app_doc['service_type']]} application has been received and payment of Rs.{SERVICE_FEE_INR} is confirmed.\n"
                                f"Track it anytime with your Application ID: {app_doc['application_id']}",
                                app_doc["application_id"])


# ---------------- Applications ----------------

async def next_application_id() -> str:
    year = datetime.now(timezone.utc).year
    rec = await db.counters.find_one_and_update(
        {"_id": f"app_counter_{year}"}, {"$inc": {"seq": 1}},
        upsert=True, return_document=True)
    return f"FE-{year}-{rec['seq']:05d}"


class CreateApplicationBody(BaseModel):
    service_type: str


@api.post("/applications")
async def create_application(body: CreateApplicationBody, user: dict = Depends(get_current_user)):
    if body.service_type not in SERVICES:
        raise HTTPException(400, "Invalid service type")
    existing = await db.applications.find_one({"user_id": str(user["_id"]), "service_type": body.service_type, "status": "draft"})
    if existing:
        return serialize(existing)
    app_id = await next_application_id()
    doc = {
        "application_id": app_id, "user_id": str(user["_id"]),
        "service_type": body.service_type, "applicant_data": {},
        "documents": [], "status": "draft", "payment_status": "pending",
        "admin_notes": [], "status_history": [{"status": "draft", "at": now_iso()}],
        "created_at": now_iso(), "updated_at": now_iso(),
    }
    await db.applications.insert_one(doc)
    return serialize(doc)


@api.get("/applications/mine")
async def my_applications(user: dict = Depends(get_current_user)):
    cursor = db.applications.find({"user_id": str(user["_id"])}).sort("created_at", -1).limit(100)
    return [serialize(a) async for a in cursor]


async def get_owned_application(application_id: str, user: dict) -> dict:
    app_doc = await db.applications.find_one({"application_id": application_id})
    if not app_doc:
        raise HTTPException(404, "Application not found")
    if user.get("role") != "admin" and app_doc["user_id"] != str(user["_id"]):
        raise HTTPException(403, "You can only access your own applications")
    return app_doc


@api.get("/applications/{application_id}")
async def get_application(application_id: str, user: dict = Depends(get_current_user)):
    app_doc = await get_owned_application(application_id, user)
    data = serialize(app_doc)
    payment = await db.payments.find_one({"application_id": application_id, "status": "paid"})
    data["payment"] = serialize(payment) if payment else None
    return data


@api.patch("/applications/{application_id}")
async def update_application(application_id: str, body: dict, user: dict = Depends(get_current_user)):
    app_doc = await get_owned_application(application_id, user)
    if app_doc["status"] != "draft":
        raise HTTPException(400, "This application has already been submitted and can no longer be edited")
    applicant_data = body.get("applicant_data", {})
    if not isinstance(applicant_data, dict):
        raise HTTPException(400, "Invalid data")
    clean = {k: (str(v)[:500] if isinstance(v, (str, int, float)) else v) for k, v in applicant_data.items()}
    await db.applications.update_one(
        {"_id": app_doc["_id"]},
        {"$set": {"applicant_data": clean, "updated_at": now_iso()}})
    return serialize(await db.applications.find_one({"_id": app_doc["_id"]}))


@api.get("/applications/track/{application_id}")
async def track_application(application_id: str):
    app_doc = await db.applications.find_one({"application_id": application_id.strip().upper()})
    if not app_doc or app_doc["status"] == "draft":
        raise HTTPException(404, "Application not found. Please check your Application ID.")
    return {
        "application_id": app_doc["application_id"],
        "service_type": app_doc["service_type"],
        "service_name": SERVICES[app_doc["service_type"]],
        "status": app_doc["status"],
        "payment_status": app_doc["payment_status"],
        "submitted_at": app_doc["created_at"],
        "last_updated": app_doc["updated_at"],
        "timeline": app_doc.get("status_history", []),
        "documents_count": len(app_doc.get("documents", [])),
    }


# ---------------- Documents ----------------

@api.post("/documents/upload")
async def upload_document(application_id: str = Form(...), doc_type: str = Form(...),
                          file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    app_doc = await get_owned_application(application_id, user)
    if app_doc["status"] not in ("draft", "need_more_info"):
        raise HTTPException(400, "Documents can no longer be modified for this application")
    valid_keys = {d["key"] for d in DOC_SPECS[app_doc["service_type"]]}
    if doc_type not in valid_keys:
        raise HTTPException(400, "Unknown document type")
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, "Only JPG, JPEG, PNG and PDF files are allowed")
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(400, f"File exceeds the {MAX_UPLOAD_BYTES // (1024*1024)}MB size limit")
    if len(content) == 0:
        raise HTTPException(400, "Empty file")
    app_dir = UPLOAD_DIR / application_id
    app_dir.mkdir(exist_ok=True)
    docs = app_doc.get("documents", [])
    for old in docs:
        if old["doc_type"] == doc_type:
            old_path = UPLOAD_DIR / application_id / old["stored_name"]
            if old_path.exists():
                old_path.unlink()
    docs = [d for d in docs if d["doc_type"] != doc_type]
    stored_name = f"{doc_type}_{uuid.uuid4().hex[:10]}{ext}"
    (app_dir / stored_name).write_bytes(content)
    spec = next(d for d in DOC_SPECS[app_doc["service_type"]] if d["key"] == doc_type)
    docs.append({"doc_type": doc_type, "label": spec["label"], "required": spec["required"],
                 "file_name": file.filename, "stored_name": stored_name, "size": len(content),
                 "content_type": file.content_type or "application/octet-stream",
                 "verified": False, "replacement_requested": False, "uploaded_at": now_iso()})
    await db.applications.update_one({"_id": app_doc["_id"]},
                                     {"$set": {"documents": docs, "updated_at": now_iso()}})
    return serialize(await db.applications.find_one({"_id": app_doc["_id"]}))


@api.delete("/documents/{application_id}/{doc_type}")
async def delete_document(application_id: str, doc_type: str, user: dict = Depends(get_current_user)):
    app_doc = await get_owned_application(application_id, user)
    if app_doc["status"] not in ("draft", "need_more_info"):
        raise HTTPException(400, "Documents can no longer be modified for this application")
    docs = app_doc.get("documents", [])
    target = next((d for d in docs if d["doc_type"] == doc_type), None)
    if target:
        path = UPLOAD_DIR / application_id / target["stored_name"]
        if path.exists():
            path.unlink()
    docs = [d for d in docs if d["doc_type"] != doc_type]
    await db.applications.update_one({"_id": app_doc["_id"]},
                                     {"$set": {"documents": docs, "updated_at": now_iso()}})
    return serialize(await db.applications.find_one({"_id": app_doc["_id"]}))


@api.get("/documents/{application_id}/{stored_name}")
async def get_document(application_id: str, stored_name: str, user: dict = Depends(get_current_user)):
    app_doc = await get_owned_application(application_id, user)
    if not re.fullmatch(r"[A-Za-z0-9_\-\.]+", stored_name):
        raise HTTPException(400, "Invalid file name")
    doc = next((d for d in app_doc.get("documents", []) if d["stored_name"] == stored_name), None)
    if not doc:
        raise HTTPException(404, "Document not found")
    path = UPLOAD_DIR / application_id / stored_name
    if not path.exists():
        raise HTTPException(404, "File missing on server")
    return FileResponse(path, media_type=doc["content_type"], filename=doc["file_name"])


# ---------------- Payments ----------------

@api.post("/payments/create-order")
async def create_order(body: dict, user: dict = Depends(get_current_user)):
    app_doc = await get_owned_application(body.get("application_id", ""), user)
    if app_doc["payment_status"] == "paid":
        raise HTTPException(400, "This application is already paid")
    missing = [d["label"] for d in DOC_SPECS[app_doc["service_type"]]
               if d["required"] and not any(doc["doc_type"] == d["key"] for doc in app_doc.get("documents", []))]
    if missing:
        raise HTTPException(400, "Required documents missing: " + ", ".join(missing))
    if PAYMENTS_LIVE:
        order = razorpay_client.order.create({
            "amount": SERVICE_FEE_PAISE, "currency": "INR",
            "receipt": app_doc["application_id"][:40], "payment_capture": 1})
        order_id, mode, key_id = order["id"], "live", RAZORPAY_KEY_ID
    elif DEMO_MODE:
        order_id, mode, key_id = f"order_demo_{uuid.uuid4().hex[:14]}", "demo", "demo"
    else:
        raise HTTPException(503, "Payments are not configured")
    await db.payments.update_one(
        {"application_id": app_doc["application_id"], "status": {"$ne": "paid"}},
        {"$set": {"application_id": app_doc["application_id"], "order_id": order_id,
                  "amount": SERVICE_FEE_PAISE, "currency": "INR", "status": "created",
                  "mode": mode, "user_id": str(user["_id"]), "created_at": now_iso()}},
        upsert=True)
    return {"order_id": order_id, "amount": SERVICE_FEE_PAISE, "currency": "INR",
            "mode": mode, "key_id": key_id, "application_id": app_doc["application_id"]}


async def mark_payment_success(application_id: str, order_id: str, payment_id: str, mode: str):
    await db.payments.update_one(
        {"application_id": application_id, "order_id": order_id},
        {"$set": {"payment_id": payment_id, "status": "paid", "verified_at": now_iso()}})
    app_doc = await db.applications.find_one({"application_id": application_id})
    history = app_doc.get("status_history", [])
    history.append({"status": "submitted", "at": now_iso()})
    await db.applications.update_one(
        {"_id": app_doc["_id"]},
        {"$set": {"status": "submitted", "payment_status": "paid",
                  "status_history": history, "updated_at": now_iso()}})
    app_doc = await db.applications.find_one({"application_id": application_id})
    await notify_new_application(app_doc)
    return app_doc


@api.post("/payments/verify")
async def verify_payment(body: dict, user: dict = Depends(get_current_user)):
    application_id = body.get("application_id", "")
    app_doc = await get_owned_application(application_id, user)
    if app_doc["payment_status"] == "paid":
        return {"ok": True, "application": serialize(await db.applications.find_one({"_id": app_doc["_id"]}))}
    if body.get("demo"):
        if PAYMENTS_LIVE or not DEMO_MODE:
            raise HTTPException(400, "Demo payments are disabled")
        order_id = body.get("order_id", "")
        payment = await db.payments.find_one({"application_id": application_id, "order_id": order_id, "status": "created"})
        if not payment:
            raise HTTPException(400, "No pending demo order found")
        updated = await mark_payment_success(application_id, order_id, f"pay_demo_{uuid.uuid4().hex[:12]}", "demo")
        return {"ok": True, "application": serialize(updated)}
    if not PAYMENTS_LIVE:
        raise HTTPException(400, "Live payments are not configured")
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": body.get("razorpay_order_id", ""),
            "razorpay_payment_id": body.get("razorpay_payment_id", ""),
            "razorpay_signature": body.get("razorpay_signature", "")})
    except Exception:
        await db.payments.update_one({"application_id": application_id,
                                      "order_id": body.get("razorpay_order_id", "")},
                                     {"$set": {"status": "failed"}})
        raise HTTPException(400, "Payment verification failed")
    updated = await mark_payment_success(application_id, body["razorpay_order_id"], body["razorpay_payment_id"], "live")
    return {"ok": True, "application": serialize(updated)}


@api.post("/payments/webhook")
async def payment_webhook(request: Request):
    payload = await request.body()
    if RAZORPAY_WEBHOOK_SECRET and PAYMENTS_LIVE:
        signature = request.headers.get("X-Razorpay-Signature", "")
        try:
            razorpay_client.utility.verify_webhook_signature(payload.decode(), signature, RAZORPAY_WEBHOOK_SECRET)
        except Exception:
            raise HTTPException(400, "Invalid webhook signature")
    import json
    event = json.loads(payload)
    if event.get("event") == "payment.captured":
        entity = event["payload"]["payment"]["entity"]
        await db.payments.update_one({"order_id": entity.get("order_id")},
                                     {"$set": {"payment_id": entity.get("id"), "status": "paid",
                                               "verified_at": now_iso(), "webhook": True}})
    return {"status": "processed"}


# ---------------- Admin ----------------

async def audit(admin: dict, action: str, application_id: str = None, detail: str = ""):
    await db.audit_logs.insert_one({"admin_id": str(admin["_id"]), "action": action,
                                    "application_id": application_id, "detail": detail,
                                    "at": now_iso()})


@api.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    today = datetime.now(timezone.utc).date().isoformat()
    month = today[:7]
    base = {"status": {"$ne": "draft"}}
    total = await db.applications.count_documents(base)
    todays = await db.applications.count_documents({**base, "created_at": {"$gte": today}})
    pending = await db.applications.count_documents({"status": {"$in": ["submitted", "documents_under_review", "need_more_info"]}})
    processing = await db.applications.count_documents({"status": "processing"})
    completed = await db.applications.count_documents({"status": "completed"})
    paid = [p async for p in db.payments.find({"status": "paid"}, {"amount": 1, "verified_at": 1, "application_id": 1}).limit(10000)]
    total_revenue = sum(p["amount"] for p in paid) // 100
    today_revenue = sum(p["amount"] for p in paid if p.get("verified_at", "") >= today) // 100
    month_revenue = sum(p["amount"] for p in paid if p.get("verified_at", "") >= month) // 100
    by_service = {}
    apps = [a async for a in db.applications.find(base, {"service_type": 1, "application_id": 1}).limit(10000)]
    paid_app_ids = {p["application_id"] for p in paid}
    for a in apps:
        s = SERVICES[a["service_type"]]
        by_service.setdefault(s, {"applications": 0, "revenue": 0})
        by_service[s]["applications"] += 1
        if a["application_id"] in paid_app_ids:
            by_service[s]["revenue"] += SERVICE_FEE_INR
    return {"total_applications": total, "todays_applications": todays, "pending": pending,
            "processing": processing, "completed": completed, "total_revenue": total_revenue,
            "today_revenue": today_revenue, "month_revenue": month_revenue, "by_service": by_service,
            "demo_mode": DEMO_MODE, "payments_mode": "live" if PAYMENTS_LIVE else "demo"}


@api.get("/admin/applications")
async def admin_applications(service: str = "", status: str = "", search: str = "",
                             admin: dict = Depends(require_admin)):
    query = {"status": {"$ne": "draft"}}
    if service in SERVICES:
        query["service_type"] = service
    if status in APP_STATUSES and status != "draft":
        query["status"] = status
    if search.strip():
        rx = {"$regex": re.escape(search.strip()), "$options": "i"}
        query["$or"] = [{"application_id": rx}, {"applicant_data.full_name": rx},
                        {"applicant_data.mobile": rx}, {"applicant_data.email": rx}]
    cursor = db.applications.find(query).sort("created_at", -1).limit(500)
    return [serialize(a) async for a in cursor]


@api.get("/admin/applications/{application_id}")
async def admin_application_detail(application_id: str, admin: dict = Depends(require_admin)):
    app_doc = await db.applications.find_one({"application_id": application_id})
    if not app_doc:
        raise HTTPException(404, "Application not found")
    data = serialize(app_doc)
    from bson import ObjectId
    owner = await db.users.find_one({"_id": ObjectId(app_doc["user_id"])})
    data["customer"] = {"name": owner["name"], "email": owner["email"], "phone": owner.get("phone", "")} if owner else None
    payment = await db.payments.find_one({"application_id": application_id})
    data["payment"] = serialize(payment) if payment else None
    return data


@api.patch("/admin/applications/{application_id}/status")
async def admin_update_status(application_id: str, body: dict, admin: dict = Depends(require_admin)):
    status = body.get("status", "")
    if status not in APP_STATUSES or status == "draft":
        raise HTTPException(400, "Invalid status")
    app_doc = await db.applications.find_one({"application_id": application_id})
    if not app_doc:
        raise HTTPException(404, "Application not found")
    history = app_doc.get("status_history", [])
    history.append({"status": status, "at": now_iso()})
    await db.applications.update_one({"_id": app_doc["_id"]},
                                     {"$set": {"status": status, "status_history": history,
                                               "updated_at": now_iso()}})
    note = (body.get("note") or "").strip()
    if note:
        await db.applications.update_one({"_id": app_doc["_id"]},
                                         {"$push": {"admin_notes": {"note": note[:1000],
                                                                    "by": admin["email"], "at": now_iso()}}})
    email = app_doc.get("applicant_data", {}).get("email")
    if email:
        label = status.replace("_", " ").title()
        await send_notification("email", "status_update_customer", email,
                                f"Application {application_id} status updated to: {label}",
                                application_id)
    await audit(admin, "status_update", application_id, f"-> {status}")
    return serialize(await db.applications.find_one({"_id": app_doc["_id"]}))


@api.post("/admin/applications/{application_id}/notes")
async def admin_add_note(application_id: str, body: dict, admin: dict = Depends(require_admin)):
    note = (body.get("note") or "").strip()
    if not note:
        raise HTTPException(400, "Note cannot be empty")
    result = await db.applications.update_one(
        {"application_id": application_id},
        {"$push": {"admin_notes": {"note": note[:1000], "by": admin["email"], "at": now_iso()}},
         "$set": {"updated_at": now_iso()}})
    if result.matched_count == 0:
        raise HTTPException(404, "Application not found")
    await audit(admin, "add_note", application_id, note[:80])
    return {"ok": True}


@api.patch("/admin/applications/{application_id}/documents/{doc_type}")
async def admin_document_action(application_id: str, doc_type: str, body: dict,
                                admin: dict = Depends(require_admin)):
    action = body.get("action", "")
    app_doc = await db.applications.find_one({"application_id": application_id})
    if not app_doc:
        raise HTTPException(404, "Application not found")
    docs = app_doc.get("documents", [])
    target = next((d for d in docs if d["doc_type"] == doc_type), None)
    if not target:
        raise HTTPException(404, "Document not found")
    updates = {"updated_at": now_iso()}
    if action == "verify":
        target["verified"] = True
        target["replacement_requested"] = False
    elif action == "unverify":
        target["verified"] = False
    elif action == "request_replacement":
        target["replacement_requested"] = True
        target["verified"] = False
        updates["status"] = "need_more_info"
        history = app_doc.get("status_history", [])
        history.append({"status": "need_more_info", "at": now_iso()})
        updates["status_history"] = history
        email = app_doc.get("applicant_data", {}).get("email")
        if email:
            await send_notification("email", "document_replacement_customer", email,
                                    f"Application {application_id}: please re-upload your {target['label']} - a clearer copy is required.",
                                    application_id)
    else:
        raise HTTPException(400, "Invalid action")
    updates["documents"] = docs
    await db.applications.update_one({"_id": app_doc["_id"]}, {"$set": updates})
    await audit(admin, f"document_{action}", application_id, doc_type)
    return serialize(await db.applications.find_one({"_id": app_doc["_id"]}))


@api.get("/admin/analytics")
async def admin_analytics(admin: dict = Depends(require_admin)):
    since = (datetime.now(timezone.utc) - timedelta(days=29)).date().isoformat()
    apps = [a async for a in db.applications.find({"status": {"$ne": "draft"}}, {"created_at": 1, "service_type": 1, "status": 1}).limit(10000)]
    paid = [p async for p in db.payments.find({"status": "paid"}, {"verified_at": 1, "amount": 1}).limit(10000)]
    days = [(datetime.now(timezone.utc).date() - timedelta(days=i)).isoformat() for i in range(29, -1, -1)]
    apps_over_time = [{"date": d[5:], "count": sum(1 for a in apps if a["created_at"][:10] == d)} for d in days]
    revenue_over_time = [{"date": d[5:], "revenue": sum(p["amount"] for p in paid if p.get("verified_at", "")[:10] == d) // 100} for d in days]
    by_service = {}
    for a in apps:
        name = SERVICES[a["service_type"]]
        by_service[name] = by_service.get(name, 0) + 1
    status_dist = {}
    for a in apps:
        status_dist[a["status"]] = status_dist.get(a["status"], 0) + 1
    return {"apps_over_time": apps_over_time, "revenue_over_time": revenue_over_time,
            "by_service": [{"name": k, "count": v} for k, v in by_service.items()],
            "status_distribution": [{"name": k.replace("_", " ").title(), "value": v} for k, v in status_dist.items()]}


@api.get("/admin/notifications")
async def admin_notifications(admin: dict = Depends(require_admin)):
    cursor = db.notifications.find({}).sort("created_at", -1).limit(20)
    return [serialize(n) async for n in cursor]


# ---------------- Config & health ----------------

@api.get("/")
async def root():
    return {"message": "FormEase API", "demo_mode": DEMO_MODE}


@api.get("/config")
async def public_config():
    return {"services": [{"key": k, "name": v, "fee": SERVICE_FEE_INR} for k, v in SERVICES.items()],
            "doc_specs": DOC_SPECS, "payments_mode": "live" if PAYMENTS_LIVE else "demo",
            "demo_mode": DEMO_MODE, "max_upload_mb": int(os.environ.get("MAX_UPLOAD_MB", "5"))}


# ---------------- Startup: indexes + seeding ----------------

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({"name": "FormEase Admin", "email": admin_email,
                                   "phone": "", "password_hash": hash_password(admin_password),
                                   "role": "admin", "created_at": now_iso()})
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}})


async def seed_demo_data():
    if os.environ.get("SEED_SAMPLE_DATA", "false").lower() != "true":
        return
    if await db.users.find_one({"email": "demo@formease.in"}) is None:
        await db.users.insert_one({"name": "Demo Customer", "email": "demo@formease.in",
                                   "phone": "9876543210", "password_hash": hash_password("Demo@12345"),
                                   "role": "customer", "created_at": now_iso()})
    if await db.applications.count_documents({}) > 0:
        return
    demo_user = await db.users.find_one({"email": "demo@formease.in"})
    samples = [
        ("scholarship", "Aarav Sharma", "completed", 26), ("pan", "Priya Nair", "completed", 22),
        ("learner", "Rohit Verma", "processing", 18), ("scholarship", "Sneha Iyer", "processing", 14),
        ("pan", "Mohammed Faiz", "documents_under_review", 10), ("learner", "Ananya Das", "submitted", 6),
        ("pan", "Vikram Singh", "submitted", 3), ("scholarship", "Kavya Reddy", "need_more_info", 1),
        ("learner", "Arjun Mehta", "submitted", 0),
    ]
    for service, name, status, days_ago in samples:
        app_id = await next_application_id()
        created = (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()
        history = [{"status": "submitted", "at": created}]
        if status != "submitted":
            history.append({"status": status, "at": (datetime.now(timezone.utc) - timedelta(days=max(days_ago - 1, 0))).isoformat()})
        docs = [{"doc_type": d["key"], "label": d["label"], "required": d["required"],
                 "file_name": f"{d['key']}.pdf", "stored_name": "", "size": 0,
                 "content_type": "application/pdf", "verified": status in ("processing", "completed"),
                 "replacement_requested": status == "need_more_info" and d["key"] == "photograph",
                 "uploaded_at": created}
                for d in DOC_SPECS[service] if d["required"]]
        await db.applications.insert_one({
            "application_id": app_id, "user_id": str(demo_user["_id"]), "service_type": service,
            "applicant_data": {"full_name": name, "mobile": "98XXXXXX10", "email": "demo@formease.in"},
            "documents": docs, "status": status, "payment_status": "paid",
            "admin_notes": [], "status_history": history, "created_at": created, "updated_at": created})
        await db.payments.insert_one({
            "application_id": app_id, "order_id": f"order_demo_{uuid.uuid4().hex[:12]}",
            "payment_id": f"pay_demo_{uuid.uuid4().hex[:12]}", "amount": SERVICE_FEE_PAISE,
            "currency": "INR", "status": "paid", "mode": "demo",
            "user_id": str(demo_user["_id"]), "created_at": created, "verified_at": created})
    logger.info("Demo sample applications seeded")


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.applications.create_index("application_id", unique=True)
    await db.applications.create_index("user_id")
    await db.password_reset_tokens.create_index("expires_at")
    await db.login_attempts.create_index("identifier")
    await seed_admin()
    await seed_demo_data()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


@app.middleware("http")
async def security_headers(request: Request, call_next):
    resp = await call_next(request)
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    resp.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return resp


app.include_router(api)

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip() and o.strip() != "*"]
allow_origins = list(dict.fromkeys([frontend_url, "http://localhost:3000", *cors_origins]))
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
