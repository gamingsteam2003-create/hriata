# FormEase — FREE Permanent Website Guide (No Credit Card, No Tokens)

## OPTION A — Vercel-only (simplest: just Vercel + MongoDB Atlas)

The repo is pre-configured (`vercel.json` at root): Vercel hosts the website AND runs the FastAPI backend as serverless functions on the same domain. You only need **2 accounts**: Vercel (GitHub sign-in) and MongoDB Atlas (Google sign-in).

1. **Atlas (database):** cloud.mongodb.com → Google sign-in → M0 Free cluster → create DB user → Network Access → allow `0.0.0.0/0` → copy connection string (your `MONGO_URL`)
2. **Vercel:** vercel.com → GitHub sign-in → **Add New → Project** → import `hriata` → leave Root Directory as **repository root** (NOT `frontend` — the root vercel.json handles everything)
3. **Environment Variables** on Vercel (add all before deploying):

   | Key | Value |
   |---|---|
   | `MONGO_URL` | your Atlas connection string |
   | `DB_NAME` | `formease` |
   | `JWT_SECRET` | any long random string |
   | `ADMIN_EMAIL` | `gamingsteam2003@gmail.com` |
   | `ADMIN_PASSWORD` | your strong admin password |
   | `FRONTEND_URL` | leave for now; after deploy set to your Vercel URL and redeploy |
   | `CORS_ORIGINS` | `*` |
   | `DEMO_MODE` | `true` |
   | `SEED_SAMPLE_DATA` | `false` |
   | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | your Razorpay keys |
   | `EMERGENT_LLM_KEY` | from Emergent backend/.env (document storage) |
   | `EMERGENT_EMAIL_KEY` | from Emergent backend/.env (real emails) |
   | `EMAIL_FROM_NAME` | `FormEase` |
   | `ADMIN_NOTIFY_EMAIL` | `gamingsteam2003@gmail.com` |
   | `REACT_APP_BACKEND_URL` | *(empty string — frontend calls /api on the same domain)* |

4. **Deploy** → ~3 minutes → you get `https://<name>.vercel.app` — website + API together.
5. Set `FRONTEND_URL` to that URL in Vercel env vars → **Redeploy** (Deployments → ⋯ → Redeploy).
6. Test: open the URL, register, apply, pay with test card `4111 1111 1111 1111`.
7. **Hostinger domain:** Vercel project → Settings → Domains → add your domain → in Hostinger DNS add the `A` record (`@` → `76.76.21.21`) and `CNAME` (`www` → `cname.vercel-dns.com`). SSL is automatic.

Notes for Option A: backend runs as serverless functions (brief cold start after idle is normal). File uploads are safe — they go to object storage, not Vercel's disk. Skip Option B below (it's the alternative 3-platform route).

---

## OPTION B — Vercel (frontend) + Render (backend) + Atlas

You will create 3 free accounts. Each one signs up with a single click using accounts you already have:

| Service | Hosts | Sign up with | Free tier |
|---|---|---|---|
| **MongoDB Atlas** | Database | your Google account (gamingsteam2003@gmail.com) | Free forever M0 |
| **Render** | Backend API | your GitHub account | Free web service |
| **Vercel** | Website (frontend) | your GitHub account | Free forever |

Total time: ~20 minutes. Follow in order.

---

## STEP 0 — Sync the latest code to GitHub (1 minute)

Your repo `hriata` is a few commits behind. In the Emergent interface: project menu → **Save to GitHub** → select `hriata`. Done.

---

## STEP 1 — MongoDB Atlas (database) — ~5 min

1. Go to **cloud.mongodb.com** → click **Sign in with Google** → use gamingsteam2003@gmail.com
2. Create a project (any name, e.g. `formease`) → **Build a Database** → choose **M0 FREE** → Create
3. It asks to create a database user: username `formease`, click **Autogenerate Secure Password** → **COPY THE PASSWORD somewhere**
4. Network Access: it may auto-add your IP — also click **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) → Confirm
5. Go to **Database → Connect → Drivers → Node.js** (any) → copy the connection string. It looks like:
   `mongodb+srv://formease:<password>@cluster0.xxxxx.mongodb.net/`
   Replace `<password>` with the password from step 3. This full string is your **MONGO_URL**.

---

## STEP 2 — Render (backend) — ~7 min

1. Go to **render.com** → **Sign up with GitHub** (your gamingsteam2003-create account)
2. **New → Web Service** → select the **hriata** repository (if asked, authorize Render to read it)
3. Fill in EXACTLY:
   - **Name:** `formease-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free
4. Click **Add Environment Variable** for each of these (copy values from your Emergent project's `backend/.env` where marked [copy]):

   | Key | Value |
   |---|---|
   | `MONGO_URL` | your Atlas string from Step 1 |
   | `DB_NAME` | `formease` |
   | `JWT_SECRET` | [copy] |
   | `ADMIN_EMAIL` | `gamingsteam2003@gmail.com` |
   | `ADMIN_PASSWORD` | [copy] |
   | `FRONTEND_URL` | `https://TEMP.vercel.app` (temporary — you'll fix it in Step 4) |
   | `CORS_ORIGINS` | `*` |
   | `DEMO_MODE` | `true` |
   | `SEED_SAMPLE_DATA` | `false` |
   | `RAZORPAY_KEY_ID` | [copy] |
   | `RAZORPAY_KEY_SECRET` | [copy] |
   | `EMERGENT_LLM_KEY` | [copy] (powers document storage) |
   | `EMERGENT_EMAIL_KEY` | [copy] (powers real emails to you) |
   | `EMAIL_FROM_NAME` | `FormEase` |
   | `ADMIN_NOTIFY_EMAIL` | `gamingsteam2003@gmail.com` |

5. Click **Create Web Service** → wait ~3–5 min for deploy → at the top you get your backend URL, e.g. `https://formease-api.onrender.com`
6. Test it: open `https://formease-api.onrender.com/api/` in a browser → you should see `{"message":"FormEase API"...}`

> Free-tier behavior: after 15 min of no visitors, the backend sleeps; the next visitor waits ~30 seconds while it wakes. Fine for demos.

---

## STEP 3 — Vercel (website) — ~5 min

1. Go to **vercel.com** → **Sign up with GitHub**
2. **Add New → Project** → **Import** the **hriata** repo
3. Before deploying, set:
   - **Root Directory:** click Edit → `frontend`
   - Framework auto-detects Create React App — leave build settings as-is (the included `frontend/vercel.json` handles routing)
   - **Environment Variables** → add:

   | Key | Value |
   |---|---|
   | `REACT_APP_BACKEND_URL` | your Render URL from Step 2, e.g. `https://formease-api.onrender.com` (NO trailing slash) |
   | `REACT_APP_CONTACT_PHONE` | `+91 81199 33128` |
   | `REACT_APP_CONTACT_EMAIL` | `gamingsteam2003@gmail.com` |
   | `REACT_APP_CONTACT_WHATSAPP` | `+91 81199 33128` |
   | `REACT_APP_BUSINESS_HOURS` | `Mon-Sat, 10:00 AM - 6:00 PM IST` |

4. Click **Deploy** → ~2 minutes → you get your public URL: `https://<something>.vercel.app`
   - If `formease.vercel.app` is taken by someone else, Vercel assigns an alternative — you can rename it in Project Settings → Domains (e.g. `formease-india.vercel.app`)

---

## STEP 4 — Connect them (2 min)

1. Copy your Vercel URL (e.g. `https://formease-india.vercel.app`)
2. Go back to **Render → your service → Environment** → edit `FRONTEND_URL` to your Vercel URL → Save (auto-redeploys ~2 min)
3. Open your Vercel URL → you should see the FormEase landing page

## STEP 5 — Final test (3 min)

1. Register a customer account → apply for a service → upload a document → pay with Razorpay **test card** `4111 1111 1111 1111`, any future expiry, any CVV
2. You should get the Application ID + a real email at gamingsteam2003@gmail.com
3. Log in at `/admin` with your admin credentials → process the application
4. Track it publicly on the Track page

---

## STEP 6 — Connect your Hostinger domain (paid domain, free hosting)

Your app runs free on Vercel + Render; the Hostinger domain just points to them via DNS. (Note: Hostinger's shared web-hosting plans cannot run this app — Python backends need a VPS. Using the domain with Vercel/Render is cheaper and easier.)

Assume your domain is `yourdomain.com`:

1. **Vercel (website):** Vercel project → **Settings → Domains** → Add `yourdomain.com` and `www.yourdomain.com`. Vercel will show you the records it needs:
   - In **Hostinger → Domains → yourdomain.com → DNS / Name Servers → DNS records**, add:
     - `A` record: host `@` → `76.76.21.21`
     - `CNAME` record: host `www` → `cname.vercel-dns.com`
   - Keep Hostinger's default nameservers (don't change them).
2. **Render (backend) — give the API its own subdomain:** Render service → **Settings → Custom Domains** → Add `api.yourdomain.com` → it shows a CNAME target.
   - In Hostinger DNS add: `CNAME` record: host `api` → `formease-api.onrender.com` (your actual Render hostname).
3. **Update env vars to the final domain:**
   - Render → `FRONTEND_URL` = `https://yourdomain.com`
   - Vercel → `REACT_APP_BACKEND_URL` = `https://api.yourdomain.com` → then **Redeploy** (Vercel: Deployments → ⋯ → Redeploy) so the frontend rebuilds with the new API URL.
4. Wait 5–30 minutes for DNS to propagate. HTTPS certificates are issued automatically by both Vercel and Render.
5. Test: `https://yourdomain.com` (website) and `https://api.yourdomain.com/api/` (should return the FormEase API JSON).

---

## Troubleshooting

- **Login works but data doesn't load / CORS errors:** Step 4 wasn't done — `FRONTEND_URL` on Render must exactly match your Vcel URL.
- **Backend shows "Application failed to respond":** check Render logs; usually a typo in an env var (most often `MONGO_URL` password with special characters — if your Atlas password contains `@` or `#`, regenerate a simpler one in Atlas → Database Access).
- **Emails not arriving:** check spam; confirm `EMERGENT_EMAIL_KEY` is copied correctly.
- **"Storage service unavailable" on upload:** `EMERGENT_LLM_KEY` missing/wrong on Render.

## Notes

- Google sign-in, emails, and document storage all use Emergent's managed integration keys — they work from any host as long as your Emergent account is active.
- Render free tier's disk is temporary, but your documents are safe — they're in object storage, not on Render's disk.
- When Razorpay KYC is approved: generate `rzp_live_` keys → update the two Razorpay env vars on Render → real money instantly.
