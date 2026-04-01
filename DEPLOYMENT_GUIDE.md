# 🚀 Doctors Farms - Complete Deployment Guide

## System Architecture

```
┌─────────────────────────────────────┐
│     Frontend (React + TypeScript)    │
│  - User requests bookings/inquiries  │
│  - Makes API calls to /api/*         │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│     Backend (Express.js/Node.js)     │
│  - Serves BOTH frontend & API routes │
│  - Handles emails via Nodemailer    │
│  - CORS enabled for flexibility      │
└─────────────────────────────────────┘
```

## Local Development (Before Deployment)

### 1. Start Backend
```bash
cd backend
npm install
npm run dev
# Backend running on http://localhost:5000
```

### 2. Start Frontend (in new terminal)
```bash
npm install
npm run dev
# Frontend running on http://localhost:5173
# API calls will use relative paths: /api/*
```

### 3. Test Booking Form
1. Open http://localhost:5173
2. Go to Contact page
3. Submit form
4. Check email: doctorsfarms686@gmail.com receives inquiry

---

## Production Deployment (Railway)

### Step 1: Build Frontend
```bash
npm run build
# Creates: dist/ directory with optimized React build
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Build frontend for production"
git push origin main
```

### Step 3: Configure Railway Backend

1. **Go to:** https://railway.app → Backend Project → Settings
2. **Deploy Section:**
   - **Start Command:** `npm start`  ← **CRITICAL: Must be set!**
   - **Environment Variables:**
     - `NODE_ENV` = `production`
     - `EMAIL_USER` = `doctorsfarms686@gmail.com`
     - `EMAIL_PASS` = Your Gmail app password (get from Google Account)
     - `FRONTEND_URL` = Backend URL (e.g., `https://your-backend.up.railway.app`)
     - `PORT` = `5000` (optional, defaults to 5000)

3. **Click Redeploy**

### Step 4: Verify Backend is Running
After redeploy, check logs for:
```
✅ Backend server running on port 5000
✅ CORS Allowed Origins: [...]
✅ SMTP transporter configured
```

### Step 5: Update Frontend Deploy
On your frontend Railway project:
- **Build Command:** `npm run build`
- **Start Command:** `npm start` or `node -e "console.log('Frontend built')"`
- Ensure `dist/` folder exists after build

---

## API Endpoints

The backend provides these endpoints:

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/send-mail` | Submit booking inquiry | None |
| POST | `/api/create-payment` | Initiate payment | None |
| GET | `/api/inquiries` | List all inquiries | Optional |
| GET | `/api/health` | Health check | None |
| GET | `/api/debug/config` | Show SMTP config | Dev only |

---

## Frontend API Configuration

**File:** `src/config/api.ts`

```typescript
// Automatically:
// 1. Uses VITE_API_URL if environment variable is set
// 2. Falls back to relative paths (/api/*) if not set
// 3. Works for both combined and separate deployments
```

**All API calls use:** 
```typescript
fetch(getApiEndpoint('/api/send-mail'), {...})
// Becomes: /api/send-mail (relative path)
// OR: https://backend.railway.app/api/send-mail (if VITE_API_URL set)
```

---

## Troubleshooting

### Problem: "Server not reachable" on booking form

**Check:**
1. Is Railway backend running? → Check logs in Railway Dashboard
2. Is Start Command set? → Should be `npm start`
3. Do logs show Node.js output? OR only "handled request" proxy logs?
   - ❌ Only proxy logs = Backend app not running
   - ✅ Shows "Backend server running" = Backend is active

**Fix:**
```bash
# Locally test backend
cd backend
npm install
npm start
# Visit: http://localhost:5000/api/health
# Should return: { "status": "ok" }
```

### Problem: Emails not being sent

**Check:**
1. `EMAIL_USER` and `EMAIL_PASS` set in Railway? → Check Settings → Variables
2. Are they Gmail credentials with app password? → Not regular Gmail password
3. Check backend logs for SMTP errors

**To get Gmail app password:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy the 16-character password
4. Paste as `EMAIL_PASS` in Railway

### Problem: Frontend shows "Unexpected error"

**Check browser console (F12 → Console tab):**
- Look for `[API]` log messages
- Check if request is being sent to correct URL
- Look for CORS errors (red messages)

---

## Database Notes

Currently using **JSON files** for data:
- `backend/inquiries.json` — Stores booking inquiries
- Simple and no setup required
- For production: Consider PostgreSQL, MongoDB, or Firebase

---

## What Gets Deployed

1. **Backend (`backend/`)** → Railway App
   - `server.js` — Main Express server
   - `inquiries.json` — Bookings database
   - `package.json` — Dependencies

2. **Frontend (`dist/`)** → Served by Backend
   - Built React app (HTML/CSS/JS)
   - Tree-shaken and minified by Vite
   - Automatically deployed with backend

---

## Quick Checklist Before Going Live

- [ ] Build frontend: `npm run build`
- [ ] Test locally: `npm run dev` (frontend) + `cd backend && npm run dev` (backend)
- [ ] Push to GitHub: `git push origin main`
- [ ] Update Railway Backend Start Command: `npm start`
- [ ] Set Railway Environment Variables (EMAIL_USER, EMAIL_PASS, etc.)
- [ ] Redeploy Railway backend
- [ ] Check logs for "✅ Backend server running"
- [ ] Test booking form on production
- [ ] Check email inbox for test inquiry

---

## Environment Variables Summary

| Variable | Frontend | Backend | Required | Example |
|----------|----------|---------|----------|---------|
| `VITE_API_URL` | ✅ | ❌ | No* | `https://backend.railway.app` |
| `NODE_ENV` | ❌ | ✅ | Yes | `production` |
| `EMAIL_USER` | ❌ | ✅ | Yes | `doctorsfarms686@gmail.com` |
| `EMAIL_PASS` | ❌ | ✅ | Yes | Gmail app password (16 chars) |
| `FRONTEND_URL` | ❌ | ✅ | No | Backend URL for CORS |
| `PORT` | ❌ | ✅ | No | `5000` |

*`VITE_API_URL` is optional if frontend and backend are on same domain (combined deployment). Required only for separate deployments.

---

## Contact & Support

- **Email:** doctorsfarms686@gmail.com
- **Phone:** +91 99555 75969
- **WhatsApp:** [Message us](https://wa.me/919955575969)

