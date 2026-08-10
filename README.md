# FormEase — Your Forms. Simplified.

Premium online application assistance platform for three services, each at a flat **₹250** assistance fee:

1. Scholarship Application Assistance
2. PAN Card Application Assistance
3. Learner's Licence Application Assistance

> FormEase is an **independent application assistance service** and is not a government website or government authority. It does not issue PAN cards, licences, scholarships or certificates.

## Stack

- **Frontend:** React 19, Tailwind CSS, shadcn/ui, Framer Motion, React Three Fiber (3D hero), Recharts
- **Backend:** FastAPI (Python), Motor (async MongoDB)
- **Database:** MongoDB
- **Payments:** Razorpay (server-side order creation + signature verification + webhook). Ships in **Demo Mode** (simulated checkout) until real keys are configured.
- **Notifications:** WhatsApp Cloud API + Resend email architecture — **mocked/logged** until provider keys are configured.

## Project Structure

```
/app
├── backend/
│   ├── server.py          # FastAPI app: auth, applications, documents, payments, admin, notifications
│   ├── uploads/           # Private document storage (served only via authenticated endpoints)
│   ├── requirements.txt
│   ├── .env               # Local secrets (NEVER commit)
│   └── .env.example       # Template for all required env vars
└── frontend/
    ├── src/
    │   ├── components/    # Navbar, Footer, Hero3D, FileUpload, ui/ (shadcn)
    │   ├── context/       # AuthContext (JWT httpOnly cookie auth)
    │   ├── lib/           # api client, service config
    │   └── pages/         # Landing, Track, Auth, Apply (6-step wizard), Dashboard, admin/, Legal
    └── public/            # index.html (SEO/OG meta), robots.txt, sitemap.xml
```

## Features

- Premium 3D landing page (abstract floating documents / ID card / shield / checkmark, mouse-parallax, mobile fallback)
- Sticky translucent navbar + mobile drawer
- 6-step application wizard: Personal Details → Application Details → Documents → Review → Payment → Submitted (with save-progress, back/edit, per-field validation)
- Drag & drop document uploader (JPG/JPEG/PNG/PDF, 5MB limit, progress, preview, delete/replace, Required/Optional badges)
- ₹250 payment: Razorpay live mode when keys exist, otherwise clearly-labeled Demo Mode modal; server-side verification only
- Unique Application IDs: `FE-YEAR-XXXXX` (atomic counter)
- Public tracking page with status timeline (no sensitive data exposed)
- Customer dashboard: profile, my applications, payment history
- Admin dashboard (`/admin`, role-gated): stats, revenue (total/today/monthly/by-service), 4 analytics charts, searchable/filterable applications table, application detail with secure document view/verify/request-replacement, status management, private admin notes, notification log
- Notifications: WhatsApp admin alert + customer/admin emails (mocked until keys configured)
- Security: bcrypt hashing, JWT httpOnly cookies, RBAC, brute-force lockout (5 attempts / 15 min), private authenticated document URLs, security headers, audit logs, env-only secrets
- SEO: titles, meta descriptions, Open Graph, robots.txt, sitemap.xml
- Legal pages: Privacy Policy, Terms & Conditions, Refund Policy

## Setup

```bash
cd backend && pip install -r requirements.txt
cp .env.example .env   # fill in values
cd ../frontend && yarn install
```

Both services are supervisor-managed in this environment (`sudo supervisorctl restart backend frontend`).

## Environment Variables

See `backend/.env.example`. Key groups:

- **Core:** `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `FRONTEND_URL`
- **Admin seed:** `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- **Demo mode:** `DEMO_MODE=true` enables simulated payments + sample dashboard data
- **Razorpay (live):** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` — leave empty for Demo Mode
- **WhatsApp Cloud API:** `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `ADMIN_WHATSAPP_NUMBER` — leave empty for mocked notifications
- **Resend email:** `RESEND_API_KEY`, `ADMIN_NOTIFY_EMAIL` — leave empty for logged emails

## API Overview

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` `/api/auth/login` `/api/auth/logout` `/api/auth/forgot-password` `/api/auth/reset-password` | Public |
| GET | `/api/auth/me` · POST `/api/auth/refresh` | Authenticated |
| POST | `/api/applications` · GET `/api/applications/mine` · GET/PATCH `/api/applications/{id}` | Owner |
| GET | `/api/applications/track/{applicationId}` | Public (safe fields only) |
| POST | `/api/documents/upload` · DELETE/GET `/api/documents/{appId}/...` | Owner / Admin |
| POST | `/api/payments/create-order` `/api/payments/verify` `/api/payments/webhook` | Owner / Webhook |
| GET | `/api/admin/stats` `/api/admin/applications` `/api/admin/analytics` `/api/admin/notifications` | Admin |
| PATCH | `/api/admin/applications/{id}/status` · POST `.../notes` · PATCH `.../documents/{docType}` | Admin |

## Default Accounts (demo)

- **Admin:** gamingsteam2003@gmail.com / FormEase@Admin123
- **Demo customer:** demo@formease.in / Demo@12345 (with seeded sample applications)

## Going Live Checklist

1. Set `DEMO_MODE=false`, add real Razorpay keys + webhook secret, register webhook URL `/api/payments/webhook`
2. Add WhatsApp Cloud API credentials and Resend key
3. Replace placeholder contact values in `frontend/.env`
4. Serve over HTTPS, rotate `JWT_SECRET`, use a strong `ADMIN_PASSWORD`
