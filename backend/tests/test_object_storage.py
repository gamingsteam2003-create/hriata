"""E2E test for the Emergent object-storage migration (documents)."""
import io
import os
import uuid
import struct
import zlib
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "gamingsteam2003@gmail.com"
ADMIN_PASSWORD = "FormEase@Admin123"


def _tiny_png():
    """Build a valid 1x1 PNG in-memory."""
    sig = b"\x89PNG\r\n\x1a\n"
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    raw = b"\x00\xff\x00\x00"
    idat = zlib.compress(raw)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


PNG_A = _tiny_png()
PNG_B = _tiny_png() + b"\x00"  # different bytes → different length


@pytest.fixture(scope="module")
def customer():
    s = requests.Session()
    email = f"TEST_stor_{uuid.uuid4().hex[:6]}@t.com"
    r = s.post(f"{API}/auth/register", json={
        "name": "Storage Test", "email": email, "phone": "9876500000", "password": "GoodPass1!"
    })
    assert r.status_code == 200, r.text
    return s, email


@pytest.fixture(scope="module")
def other_customer():
    s = requests.Session()
    email = f"TEST_other_{uuid.uuid4().hex[:6]}@t.com"
    r = s.post(f"{API}/auth/register", json={
        "name": "Other", "email": email, "phone": "9876500001", "password": "GoodPass1!"
    })
    assert r.status_code == 200
    return s


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    return s


@pytest.fixture(scope="module")
def app_with_doc(customer):
    s, _ = customer
    r = s.post(f"{API}/applications", json={"service_type": "pan"})
    assert r.status_code == 200
    app_id = r.json()["application_id"]

    r = s.post(f"{API}/documents/upload",
               data={"application_id": app_id, "doc_type": "photograph"},
               files={"file": ("photo.png", PNG_A, "image/png")})
    assert r.status_code == 200, r.text
    docs = r.json()["documents"]
    doc = next(d for d in docs if d["doc_type"] == "photograph")
    assert doc["storage_path"].startswith("formease/uploads/")
    assert doc["size"] == len(PNG_A)
    return s, app_id, doc


class TestUploadDownload:
    def test_upload_returns_storage_path(self, app_with_doc):
        _, _, doc = app_with_doc
        assert "storage_path" in doc and doc["storage_path"]
        assert doc["file_name"] == "photo.png"
        assert doc["content_type"] == "image/png"

    def test_owner_can_download_bytes_match(self, app_with_doc):
        s, app_id, doc = app_with_doc
        r = s.get(f"{API}/documents/{app_id}/{doc['stored_name']}")
        assert r.status_code == 200
        assert r.content == PNG_A
        assert r.headers["Content-Type"].startswith("image/png")

    def test_admin_can_download(self, app_with_doc, admin):
        _, app_id, doc = app_with_doc
        r = admin.get(f"{API}/documents/{app_id}/{doc['stored_name']}")
        assert r.status_code == 200
        assert r.content == PNG_A

    def test_unauthenticated_401(self, app_with_doc):
        _, app_id, doc = app_with_doc
        r = requests.get(f"{API}/documents/{app_id}/{doc['stored_name']}")
        assert r.status_code == 401

    def test_other_customer_forbidden(self, app_with_doc, other_customer):
        _, app_id, doc = app_with_doc
        r = other_customer.get(f"{API}/documents/{app_id}/{doc['stored_name']}")
        assert r.status_code == 403

    def test_path_traversal_rejected(self, app_with_doc):
        s, app_id, _ = app_with_doc
        r = s.get(f"{API}/documents/{app_id}/..%2Fetc%2Fpasswd")
        assert r.status_code in (400, 404)


class TestReplaceAndDelete:
    def test_replace_and_download_new(self, customer):
        s, _ = customer
        r = s.post(f"{API}/applications", json={"service_type": "pan"})
        app_id = r.json()["application_id"]

        # first upload
        r = s.post(f"{API}/documents/upload",
                   data={"application_id": app_id, "doc_type": "identity_proof"},
                   files={"file": ("id_v1.png", PNG_A, "image/png")})
        assert r.status_code == 200
        old = next(d for d in r.json()["documents"] if d["doc_type"] == "identity_proof")

        # replace with different content
        r = s.post(f"{API}/documents/upload",
                   data={"application_id": app_id, "doc_type": "identity_proof"},
                   files={"file": ("id_v2.png", PNG_B, "image/png")})
        assert r.status_code == 200
        new = next(d for d in r.json()["documents"] if d["doc_type"] == "identity_proof")
        assert new["stored_name"] != old["stored_name"]
        assert new["size"] == len(PNG_B)

        # new one downloads with new bytes
        r = s.get(f"{API}/documents/{app_id}/{new['stored_name']}")
        assert r.status_code == 200
        assert r.content == PNG_B

        # old reference is dropped from the app
        r = s.get(f"{API}/applications/{app_id}")
        docs = r.json()["documents"]
        assert not any(d["stored_name"] == old["stored_name"] for d in docs)
        # old stored_name is no longer downloadable (not in doc list → 404)
        r = s.get(f"{API}/documents/{app_id}/{old['stored_name']}")
        assert r.status_code == 404

    def test_delete_then_download_404(self, customer):
        s, _ = customer
        r = s.post(f"{API}/applications", json={"service_type": "pan"})
        app_id = r.json()["application_id"]
        r = s.post(f"{API}/documents/upload",
                   data={"application_id": app_id, "doc_type": "address_proof"},
                   files={"file": ("addr.png", PNG_A, "image/png")})
        doc = next(d for d in r.json()["documents"] if d["doc_type"] == "address_proof")

        r = s.delete(f"{API}/documents/{app_id}/address_proof")
        assert r.status_code == 200
        assert not any(d["doc_type"] == "address_proof" for d in r.json()["documents"])

        r = s.get(f"{API}/documents/{app_id}/{doc['stored_name']}")
        assert r.status_code == 404


class TestUploadValidation:
    def test_reject_bad_extension(self, customer):
        s, _ = customer
        r = s.post(f"{API}/applications", json={"service_type": "pan"})
        app_id = r.json()["application_id"]
        r = s.post(f"{API}/documents/upload",
                   data={"application_id": app_id, "doc_type": "photograph"},
                   files={"file": ("evil.exe", b"MZ", "application/octet-stream")})
        assert r.status_code == 400

    def test_reject_empty_file(self, customer):
        s, _ = customer
        r = s.post(f"{API}/applications", json={"service_type": "pan"})
        app_id = r.json()["application_id"]
        r = s.post(f"{API}/documents/upload",
                   data={"application_id": app_id, "doc_type": "photograph"},
                   files={"file": ("empty.png", b"", "image/png")})
        assert r.status_code == 400
