# Railway Deployment Guide

## Prerequisites
- Both projects deployed to Railway (frontend + backend)
- Frontend: https://doctors-farms-production.up.railway.app
- Backend: https://doctors-farms-backend.up.railway.app

---

## Step 1: Frontend Environment Variables (CRITICAL)

### 🚨 MOST IMPORTANT STEP

Your frontend **MUST** have this environment variable set in Railway dashboard:

```
VITE_API_URL=https://doctors-farms-backend.up.railway.app
```

### How to Set It in Railway Dashboard:

1. **Go to Railway Dashboard** → https://railway.app
2. **Select your Frontend Project** (doctors-farms-production)
3. **Click Settings** → Variables
4. **Add New Variable:**
   - Key: `VITE_API_URL`
   - Value: `https://doctors-farms-backend.up.railway.app`
5. **Save** and **Manually Redeploy** (click Deploy button, don't just push)

---

## Step 2: Backend Environment Variables

### Set in Railway Dashboard:

```
FRONTEND_URL=https://doctors-farms-production.up.railway.app
BACKEND_URL=https://doctors-farms-backend.up.railway.app
NODE_ENV=production
```

### Optional: Email Configuration (if needed)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=doctorsfarms686@gmail.com
SMTP_PASS=your-app-password-here
```

### Optional: PhonePe Configuration

```
PHONEME_MERCHANT_ID=your-merchant-id
PHONEME_SALT_KEY=your-salt-key
```

---

## Step 3: Critical Checks

### ✅ Before Deployments

- [ ] Frontend `.env.production` has `VITE_API_URL` set
- [ ] Railway dashboard Frontend project variables include `VITE_API_URL`
- [ ] Backend `/health` endpoint is accessible (test in browser)
- [ ] CORS is configured in `backend/server.js`

### ✅ After Manual Redeploy

1. **Visit Frontend:** https://doctors-farms-production.up.railway.app
2. **Open DevTools** (F12 → Console)
3. **Look for this log:**
   ```
   🔧 [API Configuration]
      Base URL: https://doctors-farms-backend.up.railway.app
      Environment: production
   ```
4. **If it shows `localhost:5003`:** ❌ Environment variable NOT applied
5. **If it shows backend URL:** ✅ Correct!

---

## Step 4: Test API Connectivity

### From Frontend Console (F12 → Console):

```javascript
// Test if backend is reachable
fetch('https://doctors-farms-backend.up.railway.app/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend OK:', d))
  .catch(e => console.error('❌ Backend Error:', e))
```

### Expected Response:
```json
{
  "status": "ok",
  "message": "Backend is alive and running",
  "timestamp": "2026-03-30T..."
}
```

---

## Step 5: Test Complete Flow

### On Mobile/Another Device:

1. **Open:** https://doctors-farms-production.up.railway.app
2. **Press F12 → Network tab**
3. **Fill booking form**
4. **Click "Send Inquiry"**
5. **Check request:**
   - Request URL should be: `https://doctors-farms-backend.up.railway.app/api/send-mail`
   - NOT: `http://localhost:5003/...`
   - Status should be: `200 OK` or similar success

---

## Troubleshooting

### ❌ Problem: API URL shows `localhost` in production

```
🔧 [API Configuration]
   Base URL: http://localhost:5003  ← WRONG!
```

**Solution:**
1. Check Railway dashboard → Frontend variables
2. `VITE_API_URL` might be missing
3. Click **Manual Redeploy** button (not just push)
4. Wait 2-3 minutes for rebuild
5. Hard refresh in browser (Ctrl+Shift+R)

---

### ❌ Problem: CORS Error

```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solution:**
- Check `backend/server.js` line 20-40, ensure CORS is configured
- Add frontend URL to `allowedOrigins` array if needed
- Redeploy backend

---

### ❌ Problem: Backend `502 Bad Gateway`

**Solution:**
- Backend might be crashed or not deployed
- Check Railway backend logs:
  1. Railway Dashboard → Backend Project → Logs
  2. Look for errors (usually at startup)
  3. Check environment variables are set correctly

---

### ❌ Problem: `net::ERR_CONNECTION_REFUSED`

**Solution:**
- Backend server is not running or crashed
- Check if backend deployed successfully in Railway
- Verify `/health` endpoint accessible: https://doctors-farms-backend.up.railway.app/health

---

## Build & Deploy Commands (if using Railway CLI)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link project
railway link

# Deploy with variables
railway up --set VITE_API_URL=https://doctors-farms-backend.up.railway.app
```

---

## Environment File Structure

### `.env.local` (Local Development - NOT committed)
```
VITE_API_URL=http://localhost:5003
```

### `.env.production` (Build-time - Committed to git)
```
VITE_API_URL=https://doctors-farms-backend.up.railway.app
```

### Railway Dashboard Variables (Frontend)
```
VITE_API_URL=https://doctors-farms-backend.up.railway.app
```

---

## Variables Priority (How API URL is selected)

1. **Environment Variable** (`VITE_API_URL`) ← USED IN PRODUCTION
2. **Same Domain** (window.location.origin) ← Fallback if env var not set
3. **Localhost** (http://localhost:5003) ← Local development only

---

## Verification Checklist

- [ ] Frontend deployed to Railway
- [ ] Backend deployed to Railway
- [ ] `VITE_API_URL` set in Railway Dashboard (Frontend)
- [ ] Manual redeploy executed
- [ ] Browser logs show correct backend URL
- [ ] `/health` endpoint responds
- [ ] Booking form works on mobile
- [ ] Network tab shows correct API URL
- [ ] CORS allows frontend origin

---

## Quick Test URLs

- **Health Check:** https://doctors-farms-backend.up.railway.app/health
- **CORS Debug:** https://doctors-farms-backend.up.railway.app/api/debug/cors
- **Config Debug:** https://doctors-farms-backend.up.railway.app/api/debug/config
- **Frontend:** https://doctors-farms-production.up.railway.app

---

## 🎯 If Still Not Working

1. Check Railway logs for both projects
2. Verify `VITE_API_URL` in Railway dashboard (Frontend)
3. Look for **"[API Configuration]"** in browser console
4. Ensure it shows backend URL, not localhost
5. Test `/health` endpoint directly in browser
6. Check DevTools → Network tab → failed request details

---

**Need help?** Re-read the troubleshooting section or check Railway logs!
