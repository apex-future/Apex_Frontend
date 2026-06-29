# Deploying Apex Admin to admin.apex.pxxl.click

The admin dashboard is a separate Vite app. It is **not** part of the main `apex.pxxl.click` deployment. You deploy it as its own Vercel project and point a subdomain at it.

## Architecture

```
Browser  →  admin.apex.pxxl.click/api/admin/*  →  Vercel rewrite  →  apexbackend.pxxl.click/api/admin/*
Browser  →  admin.apex.pxxl.click/overview     →  Vercel SPA       →  admin-dashboard (static)
```

API calls go through the same subdomain (`/api/admin`), so you avoid CORS issues in production.

---

## Prerequisites

1. **Backend `ADMIN_SECRET` is set** on `apexbackend.pxxl.click` (Railway/hosting env vars).
2. **DNS for `pxxl.click`** is managed in Vercel (same as `apex.pxxl.click`).
3. **Git repo** is pushed (Vercel deploys from GitHub/GitLab).

---

## Step 1 — Verify the backend admin API

From your terminal, confirm the secret works:

```bash
curl https://apexbackend.pxxl.click/api/admin/health \
  -H "X-Admin-Secret: YOUR_ADMIN_SECRET"
```

Expected: `{"status":"ok",...}`

If you get `503`, add `ADMIN_SECRET` to your backend hosting environment and redeploy.

---

## Step 2 — Create a new Vercel project

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import the same Git repository as the main Apex frontend.
3. **Important:** set the **Root Directory** to:
   ```
   apex_frontend/admin-dashboard
   ```
4. Vercel should auto-detect **Vite**. Confirm:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. **Environment variables:** none required for production (the app uses `/api/admin` via the Vercel proxy in `vercel.json`).
6. Click **Deploy**.

Wait for the first deployment to finish. You will get a URL like `admin-dashboard-xyz.vercel.app`.

---

## Step 3 — Add the custom domain

1. In the new Vercel project, go to **Settings → Domains**.
2. Add:
   ```
   admin.apex.pxxl.click
   ```
3. Vercel will show DNS instructions. Because `apex.pxxl.click` is already on Vercel, this is usually automatic:
   - Add a **CNAME** record: `admin.apex` → `cname.vercel-dns.com`
   - Or use Vercel’s “Add subdomain” flow if the apex domain is already in the same team.
4. Wait for DNS + SSL (often 1–5 minutes, sometimes up to an hour).

---

## Step 4 — Log in

1. Open **https://admin.apex.pxxl.click**
2. Enter your **`ADMIN_SECRET`** (same value as on the backend).
3. After login you land on **/overview**.

---

## Local development

```bash
cd apex_frontend/admin-dashboard
npm install
npm run dev
```

Open **http://localhost:5175**. Dev server proxies `/api` to `apexbackend.pxxl.click`.

To point at a local backend instead:

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8000/api/admin
```

---

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| `503: Admin endpoints are not configured` | Set `ADMIN_SECRET` on the backend and redeploy. |
| `403 Forbidden` | Wrong secret — use the exact backend `ADMIN_SECRET`. |
| CORS error in browser | Production should not hit CORS (same-origin proxy). If you set `VITE_API_BASE_URL` to the backend URL directly, add `https://admin.apex.pxxl.click` to backend `CORS_ORIGINS`. |
| Blank page on refresh at `/overview` | Ensure `vercel.json` SPA rewrite is deployed (included in this folder). |
| `admin.apex.pxxl.click` 404 / wrong site | Confirm Vercel **Root Directory** is `apex_frontend/admin-dashboard`, not the main frontend root. |

---

## Optional: deploy via Vercel CLI

From the repo root:

```bash
cd apex_frontend/admin-dashboard
npm install
npx vercel --prod
```

When prompted, link a **new** project (do not reuse the main `apex.pxxl.click` project).

Then add the domain in the Vercel dashboard:

```
admin.apex.pxxl.click
```
