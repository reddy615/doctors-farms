# Backend Debugging & Troubleshooting Guide

## 🔴 Quick Status Check

### Test if Backend is Reachable

**From Browser (Any Device):**

```
http://localhost:5003/health
http://localhost:5003/api/health
```

**Expected Response (Both):**
```json
{
  "status": "ok",
  "message": "Backend is alive and responding",
  "timestamp": "2026-03-30T...",
  "version": "1.0.0"
}
```

**If you see:**
- ✅ JSON response → Backend is working
- ❌ Cannot GET / → Backend not running
- ❌ Connection refused → Port 5003 not listening
- ❌ CORS error → CORS misconfigured

---

## 🔧 Debug Endpoints

### 1. **Health Check** - Is backend alive?
```
GET /health
GET /api/health

Response: { status: "ok", message: "..." }
```

### 2. **CORS Debug** - What does backend see?
```
GET /api/debug/cors

Response shows:
{
  "origin": "http://localhost:5174",  // Your browser's origin
  "method": "GET",
  "cors_allowed_origins": [...],      // All allowed origins
  "frontend_url": "http://localhost:5174",
  "backend_url": "http://localhost:5003",
  "request_headers": {...}             // All headers sent
}
```

### 3. **Config Debug** - Current configuration
```
GET /api/debug/config

Response shows:
{
  "frontend_url": "http://localhost:5174",
  "backend_url": "http://localhost:5003",
  "phonepe_env": "sandbox",
  "smtp_configured": true,
  "admin_emails": [...],
  "environment": "development"
}
```

---

## 🔍 Browser DevTools Debugging

### Step 1: Open DevTools
```
Press F12 (Windows/Linux) or Cmd+Option+I (Mac)
```

### Step 2: Check Console Tab
Look for logs like:
```
🔑 [API Configuration]
   Base URL: https://doctors-farms-backend.up.railway.app
   Environment: production
   VITE_API_URL set: true

[API] POST https://doctors-farms-backend.up.railway.app/api/send-mail
[API] ✅ POST ... succeeded
```

**Error Examples:**
```
❌ [API Error] Failed to fetch: Cannot reach server at ...
❌ [API Error] CORS error: Cross-Origin Request Blocked
❌ [API Error] Request timeout after 30000ms
```

### Step 3: Check Network Tab
```
1. Click "Network" tab
2. Submit booking inquiry
3. Look for POST /api/send-mail request
4. Click it to see details:
```

**Good Response:**
```
Status: 200 OK
Headers: Content-Type: application/json
Body: {
  "success": true,
  "inquiryId": "INQ_...",
  "emailStatus": "sent"
}
```

**CORS Error Response:**
```
Status: (blocked)
Type: corsPreflightBlock
Message: Cross-Origin Request Blocked
```

**Inspect the Request:**
- Headers tab: See what browser sent (includes Origin header)
- Response tab: See what server returned

### Step 4: Check Application Tab
```
Storage > Local Storage
Look for: VITE_API_URL or any API configuration
```

---

## 🚨 Common Issues & Fixes

### Issue 1: "Failed to fetch" Error

**Cause:** Backend not reachable

**Debug Steps:**
1. Backend running? 
   ```bash
   # Check if port 5003 is listening
   netstat -ano | findstr :5003
   ```

2. Can you reach backend directly?
   ```
   http://localhost:5003/health
   # Should show: {"status": "ok", ...}
   ```

3. Is API URL correct?
   ```
   Open DevTools > Console
   Look for: "[API Configuration] Base URL: ..."
   Should be: https://... (not localhost)
   ```

**Fix:**
```bash
# Restart backend
cd backend
npm install
node server.js

# Should show:
✅ Backend server running on port 5003
✅ Available Endpoints:
   Health Check: http://localhost:5003/health
   ...
```

---

### Issue 2: CORS Blocking Requests

**Cause:** Frontend and backend domains don't match

**DevTools Console Shows:**
```
Access to XMLHttpRequest at 'https://doctors-farms-backend.up.railway.app/api/send-mail'
from origin 'https://doctors-farms-frontend.up.railway.app' has been blocked by CORS policy:
The value of the 'Access-Control-Allow-Origin' header in the response must not be the asterisk '*'
when the request's credentials mode is 'include'.
```

**Fix: Update Backend CORS**

Backend CORS is temporarily set to allow all origins for debugging. 

For permanent fix, update `backend/server.js`:

```javascript
// Add your production domain to allowed origins:
const allowedOrigins = [
  'http://localhost:5174',
  'http://localhost:5173',
  'https://doctors-farms-frontend.up.railway.app', // ADD YOUR DOMAIN
  'https://yourdomain.com',                         // ADD YOUR DOMAIN
  process.env.FRONTEND_URL || 'http://localhost:5174',
  process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null,
].filter(Boolean);
```

**Quick Test:**
```
http://localhost:5003/api/debug/cors
```

You'll see what origins are allowed.

---

### Issue 3: Wrong API URL Used

**Cause:** Environment variable not set or frontend not redeployed

**Check What URL is Being Used:**

1. Open DevTools > Console
2. Look for: `[API Configuration] Base URL: ...`
3. Should NOT be `localhost` in production

**Fix:**

**Frontend (.env.local or deployment settings):**
```env
VITE_API_URL=https://doctors-farms-backend.up.railway.app
```

**Then rebuild and redeploy:**
```bash
npm run build
# Deploy the dist/ folder
```

---

### Issue 4: Timeout Error

**Cause:** Backend server sleeping or overloaded

**Error Message:**
```
Request timeout after 30000ms
The server took too long to respond. Backend may be sleeping or overloaded.
```

**Solutions:**

1. **Wake up Railway backend:**
   ```
   Visit: https://doctors-farms-backend.up.railway.app/health
   This will wake it up from sleep
   ```

2. **Check Railway logs:**
   ```
   Railway Dashboard > Deployments > View Logs
   Look for: Errors, crashes, memory issues
   ```

3. **Increase timeout in code:**
   ```typescript
   // src/config/api.ts - Increase from 30000ms to 60000ms
   apiFetch('/api/send-mail', {...}, 60000)
   ```

---

### Issue 5: 404 Not Found

**Error:**
```
Server returned 404: Not Found
```

**Cause:** Wrong API endpoint path

**Check:**
- Frontend calling: `/send-inquiry`
- Backend has: `/api/send-mail`

**Backend Routes (Correct Paths):**
```
POST   /api/send-mail
GET    /api/inquiries
GET    /api/admins
GET    /api/inquiries/:id
POST   /api/create-payment
POST   /api/payment-callback
GET    /health
GET    /api/health
GET    /api/debug/cors
GET    /api/debug/config
```

---

### Issue 6: Email Not Sending

**Check:**
1. SMTP configured?
   ```
   http://localhost:5003/api/debug/config
   Look for: "smtp_configured": true
   ```

2. Check backend logs:
   ```
   Backend server.js output should show:
   ✅ SMTP transporter configured for: your-email@gmail.com
   ✅ SMTP transporter verified successfully
   ```

3. If not verified:
   ```
   backend/.env must have:
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   CONTACT_EMAIL=doctorsfarms686@gmail.com
   ```

---

## 📋 Complete Testing Checklist

### Local Testing
```
[ ] Backend running on port 5003
[ ] http://localhost:5003/health shows {"status": "ok"}
[ ] http://localhost:5003/api/debug/cors accessible
[ ] Frontend running on port 5174
[ ] Can submits booking form
[ ] Console shows: "[API] ✅ POST ... succeeded"
[ ] Inquiry saved in backend
[ ] Email received
```

### Network (LAN) Testing
```
[ ] Find laptop IP: ipconfig
[ ] Access from other device: http://192.168.x.x:5174
[ ] http://192.168.x.x:5003/health works
[ ] Booking submission works
[ ] Check DevTools for any CORS errors
```

### Production Testing
```
[ ] Backend deployed to Railway/production
[ ] Frontend deployed to Railway/production
[ ] VITE_API_URL set to production backend URL
[ ] http://your-backend-domain/health works
[ ] Browser console shows correct base URL
[ ] Booking submission works
[ ] No CORS errors in DevTools
```

---

## 🐛 Advanced Debugging

### Backend Logging

Backend logs request details:
```
[2026-03-30T10:30:45.123Z] POST /api/send-mail
  Origin: http://localhost:5174
  IP: 127.0.0.1
📧 /api/send-mail request received
✅ Admin email sent successfully
✅ User email sent successfully
```

### Simulate Backend Issues

**Test timeout:**
```
# In backend server.js temporarily add:
setTimeout(() => { /* slow response */ }, 31000)
```

**Test CORS issue:**
```
# Comment out the allow line and test
```

---

## 📞 When Nothing Works

**Collect this info:**
1. Screenshot of browser DevTools > Console (full error)
2. Screenshot of Network tab showing failed request
3. Backend server output (full logs)
4. What command you ran to start backend
5. Output of:
   ```
   echo VITE_API_URL
   curl http://localhost:5003/health
   ```

**Then I can help instantly!**

---

## 🔗 Useful Links

- Backend Health: `/health`
- Backend API: `/api/health`
- CORS Debug: `/api/debug/cors`
- Config Debug: `/api/debug/config`
- Inquiries: `/api/inquiries`
- Admins: `/api/admins`

---

## ✅ Quick Fix Summary

| Problem | Solution |
|---------|----------|
| Backend not responding | Run `node server.js` in backend folder |
| CORS errors | Backend CORS already allows all origins for testing |
| Wrong URL | Check `.env.local` has `VITE_API_URL=your-backend-url` |
| Timeout | Wait for Railway to wake up or increase timeout |
| Email not sending | Check SMTP credentials in `backend/.env` |
| 404 errors | Check correct endpoint path in backend routes |

---

## 🚀 Production Deployment Checklist

Before going live:

- [ ] Backend deployed and running
- [ ] `http://backend-url/health` returns `{"status": "ok"}`
- [ ] CORS allows frontend domain
- [ ] Frontend `.env.local` has production backend URL
- [ ] Frontend redeployed after VITE_API_URL change
- [ ] SMTP credentials are real (not dummy values)
- [ ] PhonePe credentials configured
- [ ] No `localhost` references in code
- [ ] All URLs use HTTPS
