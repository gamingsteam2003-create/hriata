# FormEase — Free Deployment Guide (Vercel + Render + MongoDB Atlas)

This app has 3 parts. Vercel hosts only the **frontend**. The **backend** (FastAPI) goes to Render, and the **database** to MongoDB Atlas — all free tiers.

---

## Step 1 — MongoDB Atlas (database, free M0)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → create free account → **Build a Database** → M0 Free
2. Create a database user (username + password)
3. Network Access → **Allow access from anywhere** (0.0.0.0/0)
4. Copy the connection string, e.g.:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/`

## Step 2 — Render (backend, free)

1. Go to [render.com](https://render.com) → sign up with GitHub → **New → Web Service** → select the `hriata` repo
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
3. Add **Environment Variables** (from `backend/.env.example`):

| Key | Value |
|---|---|
| `MONGO_URL` | your Atlas connection string |
| `DB_NAME` | `formease` |
| `JWT_SECRET` | any long random string |
| `ADMIN_EMAIL` | `gamingsteam2003@gmail.com` |
| `ADMIN_PASSWORD` | pick a strong password |
| `FRONTEND_URL` | your Vercel URL (fill after Step 3, e.g. `https://hriata.vercel.app`) |
| `DEMO_MODE` | `true` (until Razorpay keys exist) |
| `SEED_SAMPLE_DATA` | `false` |
| `EMERGENT_EMAIL_KEY` | copy from your Emergent backend/.env |
| `EMAIL_FROM_NAME` | `FormEase` |
| `ADMIN_NOTIFY_EMAIL` | `gamingsteam2003@gmail.com` |

4. Deploy → copy your backend URL, e.g. `https://formease-api.onrender.com`

> Free-tier note: Render spins down after inactivity (first request takes ~30s to wake) and its filesystem is ephemeral — uploaded documents vanish on restart. Fine for demos; upgrade or add object storage for production.

## Step 3 — Vercel (frontend, free)

1. Go to [vercel.com](https://vercel.com) → sign up with GitHub → **Add New → Project** → import `hriata`
2. Settings:
   - **Root Directory:** `frontend` (vercel.json is already configured)
   - Framework preset: Create React App (auto-detected)
3. Add **Environment Variable**:

| Key | Value |
|---|---|
| `REACT_APP_BACKEND_URL` | your Render backend URL from Step 2 (no trailing slash) |

Optional contact vars (else defaults show):
`REACT_APP_CONTACT_PHONE`, `REACT_APP_CONTACT_EMAIL`, `REACT_APP_CONTACT_WHATSAPP`, `REACT_APP_BUSINESS_HOURS`

4. **Deploy** → you get `https://hriata.vercel.app` (free domain, accessible to everyone)

## Step 4 — Connect them

1. Back in Render → set `FRONTEND_URL` = your Vercel URL → save (auto-redeploys)
2. Open your Vercel URL → register a customer → test the full flow
3. Admin: `https://hriata.vercel.app/admin` with your ADMIN_EMAIL / ADMIN_PASSWORD

## Later: real payments

Register at [dashboard.razorpay.com](https://dashboard.razorpay.com), get Key ID + Secret, add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Render → payments go live automatically (demo checkout disappears).
