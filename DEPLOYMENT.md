# Crime-X: Zoho Catalyst Deployment Guide

## Compatibility Report

### ✅ What Works Out-of-the-Box
- FastAPI backend is production-ready (CORS already uses env vars)
- Supabase integration works directly from browser (no proxy needed)
- Mistral AI chat calls go browser → Mistral directly (no proxy needed)
- All mock API data is self-contained (no external dependencies)
- React Router is properly configured for SPA navigation

### ⚠️ Changes Made (Minimum Required)

| File | Change | Reason |
|------|--------|--------|
| `backend/run.py` | Added uvicorn programmatic startup reading `X_ZOHO_CATALYST_LISTEN_PORT` | Catalyst AppSail injects the port via this env var; app must bind to it |
| `frontend/vite.config.ts` | Added `loadEnv`, `VITE_API_BASE_URL` proxy target, explicit `build.outDir`, chunk splitting | Production builds need explicit output dir; large libs (plotly, leaflet) need chunking |
| `backend/.env.example` | Added Catalyst-specific comments | Documentation only |

### 🆕 New Files Created

| File | Purpose |
|------|---------|
| `backend/app-config.json` | Tells AppSail: Python 3.11 stack, `python run.py` startup command |
| `frontend/client-package.json` | Tells Web Client Hosting: SPA routing (all 404s → index.html) |
| `frontend/.env.production.example` | Documents all required env vars for production build |
| `catalyst.json` | Catalyst project descriptor mapping web_client and appsail |
| `DEPLOYMENT.md` (this file) | Deployment guide |

---

## Prerequisites

### 1. Install Zoho Catalyst CLI
```bash
npm install -g zcatalyst-cli
catalyst login
```

### 2. Have these values ready
- Zoho Catalyst account with a project created in the console
- Supabase project URL and anon key
- (Optional) Mistral AI API key

---

## Deployment Steps

### Step 1 — Prepare Environment Variables

**Frontend `.env` (create at `frontend/.env`):**
```bash
# Copy from frontend/.env.production.example and fill in your values
cp frontend/.env.production.example frontend/.env
```

Edit `frontend/.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_MISTRAL_API_KEY=your-mistral-key        # optional
VITE_API_BASE_URL=https://your-appsail-url.catalystappsail.com
```

> **Note**: `VITE_API_BASE_URL` is your AppSail backend URL. Deploy the backend first (Step 3), then come back and set this before building the frontend.

---

### Step 2 — Build the Frontend

```bash
cd frontend
npm install
npm run build
```

Output will be in `frontend/dist/`. Verify the folder exists and contains `index.html`.

---

### Step 3 — Deploy the Backend (AppSail)

#### Option A: Via Catalyst Console (Recommended for first deploy)

1. Go to [catalyst.zoho.com](https://catalyst.zoho.com) → Your Project → **AppSail**
2. Click **Create Service**
3. Select **Python 3.11** as the runtime
4. Upload/link the `backend/` folder
5. Set **Startup Command**: `python run.py`
6. Add Environment Variables:
   ```
   CORS_ORIGINS = https://your-web-client-url.catalyst.com
   SECRET_KEY   = your-secure-random-string-here
   APP_ENV      = production
   ```
7. Click **Deploy**
8. Copy the AppSail URL (e.g., `https://crimex-api-12345678.catalystappsail.com`)

#### Option B: Via CLI
```bash
# From project root
catalyst appsail:deploy --folder backend
```

---

### Step 4 — Update CORS After Backend Deploys

Once the backend is live, set the `CORS_ORIGINS` env var in AppSail to your **frontend Web Client URL**:
```
CORS_ORIGINS=https://crime-x-12345678.catalystwebclient.com
```

In `backend/app/main.py`, CORS is already configured to read this:
```python
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
```

---

### Step 5 — Deploy the Frontend (Web Client Hosting)

1. Go to **Web Client Hosting** in the Catalyst Console
2. Click **Add Web Client** → select the `frontend/dist/` folder
3. Or via CLI:
```bash
catalyst client:setup --folder frontend/dist
catalyst deploy --only client
```

---

### Step 6 — Update `VITE_API_BASE_URL` and Rebuild

After both services are live, update `frontend/.env`:
```env
VITE_API_BASE_URL=https://your-actual-appsail-url.catalystappsail.com
```

Rebuild and redeploy the frontend:
```bash
cd frontend
npm run build
catalyst deploy --only client
```

---

### Step 7 — Update `catalyst.json`

Fill in your actual IDs from the Catalyst Console:
```json
{
  "project": {
    "project_name": "crime-x",
    "project_id": "YOUR_ACTUAL_PROJECT_ID",
    "project_key": "YOUR_ACTUAL_PROJECT_KEY",
    "org_id": "YOUR_ACTUAL_ORG_ID"
  }
}
```

---

## Startup Commands

| Service | Command |
|---------|---------|
| Backend (local dev) | `cd backend && uvicorn run:app --reload --port 8000` |
| Backend (Catalyst) | `python run.py` (auto-reads `X_ZOHO_CATALYST_LISTEN_PORT`) |
| Frontend (local dev) | `cd frontend && npm run dev` |
| Frontend (build) | `cd frontend && npm run build` |
| Full local dev | Backend in one terminal + Frontend in another |

## Build Commands

| Target | Command |
|--------|---------|
| Frontend production build | `cd frontend && npm run build` |
| Backend dependency install | `cd backend && pip install -r requirements.txt` |

---

## Environment Variable Checklist

### Backend (Set in AppSail Console)
- [ ] `CORS_ORIGINS` — Your Catalyst Web Client URL
- [ ] `SECRET_KEY` — Random secure string (use `python -c "import secrets; print(secrets.token_hex(32))"`)
- [ ] `APP_ENV` — Set to `production`

### Frontend (In `frontend/.env` before build)
- [ ] `VITE_SUPABASE_URL` — From Supabase → Settings → API
- [ ] `VITE_SUPABASE_ANON_KEY` — From Supabase → Settings → API
- [ ] `VITE_API_BASE_URL` — Your AppSail backend URL
- [ ] `VITE_MISTRAL_API_KEY` — Optional, from console.mistral.ai

---

## Deployment Checklist

- [ ] `catalyst login` — Logged in to Catalyst CLI
- [ ] `frontend/.env` — Created with all required variables
- [ ] `cd frontend && npm run build` — Build succeeds, `dist/` folder created
- [ ] Backend deployed to AppSail — URL noted
- [ ] Backend env vars set in AppSail console
- [ ] `CORS_ORIGINS` set to frontend URL in AppSail env vars
- [ ] `VITE_API_BASE_URL` set to AppSail URL in `frontend/.env`
- [ ] Frontend rebuilt after setting `VITE_API_BASE_URL`
- [ ] Frontend dist uploaded to Web Client Hosting
- [ ] `catalyst.json` updated with real project/org IDs
- [ ] Test: Open frontend URL → Login page loads
- [ ] Test: Dashboard loads with data
- [ ] Test: API calls reach backend (check browser Network tab)
- [ ] Test: No CORS errors in browser console

---

## Troubleshooting

### "CORS error" in browser console
→ `CORS_ORIGINS` in AppSail env vars does not match your frontend URL exactly. Check for trailing slashes.

### "VITE_SUPABASE_URL is not defined"
→ `frontend/.env` was not present when you ran `npm run build`. Rebuild after creating the file.

### Frontend shows blank page after deploy
→ SPA routing issue. Verify `frontend/client-package.json` has `"404": "index.html"`. This tells Catalyst to serve index.html for all unknown routes.

### Backend fails to start on Catalyst
→ Check AppSail logs. Most common cause: Python version mismatch. Ensure `python3.11` stack is selected.

### "Module not found" in backend
→ `requirements.txt` may be missing a package. Run `pip install -r requirements.txt` locally to verify.

---

## Remaining Manual Steps

1. **Create Catalyst project** in the console at [catalyst.zoho.com](https://catalyst.zoho.com) (if not done)
2. **Get Supabase credentials** from your Supabase project dashboard
3. **Deploy backend first**, note the AppSail URL
4. **Set `CORS_ORIGINS`** in AppSail to your frontend URL
5. **Set `VITE_API_BASE_URL`** in frontend `.env`, rebuild, redeploy frontend
6. **Update `catalyst.json`** with real project/org IDs from the console

---

*Generated by Antigravity AI — Crime-X Catalyst Deployment Prep*
