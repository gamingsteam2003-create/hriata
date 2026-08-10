# FormEase — Product Requirements & Progress

## Original Problem Statement
Premium 3D online application assistance platform ("FormEase — Your Forms. Simplified.") offering exactly three services at ₹250 each: Scholarship Application Assistance, PAN Card Application Assistance, Learner's Licence Application Assistance. Full scope: premium Apple/Stripe-inspired landing with React Three Fiber 3D hero, 6-step application wizard, drag-drop document uploads, Razorpay ₹250 payment with server-side verification, unique Application IDs (FE-YEAR-XXXXX), public tracking, customer accounts, secure admin dashboard (stats/table/detail/notes/status/revenue/analytics), WhatsApp + email notifications, security hardening, legal pages, SEO, demo mode for BCA minor project demonstration.

## User Choices (gathered via ask_human)
- Payments: Razorpay architecture, running in Demo Mode (simulated checkout) until real keys are provided
- WhatsApp: full service architecture, mock sender (plug in Cloud API credentials later)
- Email: architecture only (mock/log sender, Resend-ready)
- Auth: JWT email/password with role-based admin
- Priority: Balanced — elegant lightweight 3D hero + complete end-to-end workflow

## User Personas
- **Customer**: needs help completing a scholarship/PAN/learner's licence application; uploads documents, pays ₹250, tracks status via Application ID
- **Admin** (gamingsteam2003@gmail.com): reviews applications, verifies documents, requests replacements, updates statuses, adds private notes, monitors revenue/analytics

## Architecture
- React 19 + Tailwind + shadcn/ui + Framer Motion + React Three Fiber + Recharts (frontend, port 3000)
- FastAPI + Motor async MongoDB (backend, port 8001, all routes under /api)
- JWT auth via httpOnly secure cookies (access 60min + refresh 7d), bcrypt, login lockout
- Documents on disk (`backend/uploads/`), served only via authenticated endpoints
- Atomic counter collection for Application IDs; audit_logs, notifications, payments, login_attempts, password_reset_tokens collections

## Implemented (June 2026 — v1.1 update)
- Contact details set to real values: phone/WhatsApp +91 81199 33128, email gamingsteam2003@gmail.com (frontend/.env)
- Footer credit: "Created & developed by hriata_khuptong"
- REAL email notifications live via Emergent-managed Resend proxy (EMERGENT_EMAIL_KEY in backend/.env, EMAIL_FROM_NAME=FormEase) — verified "sent" to gamingsteam2003@gmail.com on new application; WhatsApp remains mocked (user opted out of WhatsApp API)
- Razorpay remains Demo Mode (user not registered yet)

## Implemented (June 2026 — v1, all tested 21/21 backend + frontend smoke pass)
- Premium landing: 3D hero (floating documents/ID card/shield/checkmark, mouse parallax, mobile CSS fallback), trust section, 3 service cards, how-it-works, contact (env-driven placeholders), footer with legal disclaimer
- Sticky translucent navbar + mobile drawer
- 6-step wizard with validation, save-progress, review, edit
- Document uploader: drag-drop, progress, preview, replace/delete, type+size validation, Required/Optional badges
- Payments: Razorpay live path + Demo Mode modal; server-side verification; payment records with order/payment IDs
- Application ID FE-2026-XXXXX + success page with copy button
- Public tracking page with 5-stage timeline
- Customer dashboard: profile, applications, payment history
- Admin dashboard: overview stats, revenue (total/today/month/by-service), 4 charts, applications table (filters + search), application detail (docs view/verify/replace, status updates, private notes), notifications log
- Notifications: WhatsApp admin + customer/admin email (mocked, DB-logged)
- Auth: register/login/logout/me/refresh/forgot/reset (demo reset link), admin + demo customer seeding
- Legal pages (Privacy/Terms/Refund), SEO meta + robots.txt + sitemap.xml, security headers, README.md, .env.example

## Backlog
- P1: Wire real Razorpay keys + webhook when provided; enable live WhatsApp/Resend
- P1: Customer-visible status detail page (currently public track page covers this)
- P2: Replace native date input with shadcn Calendar date picker (minor design consistency)
- P2: Split server.py into routers/ modules for maintainability
- P2: Rate limiting middleware beyond login lockout; CSRF origin validation hardening
- P3: Object storage (S3) for documents instead of local disk for multi-instance deployment

## Next Tasks
1. Collect Razorpay/WhatsApp/Resend keys from user when ready to go live
2. Production deploy config (HTTPS, env review)
