# 🔴 CRITICAL BACKEND DEBUGGING CHECKLIST

## Your Issues Analysis

You mentioned 5 critical issues. Let me address each:

---

## 🔴 Issue 1: Backend NOT Reachable Publicly

### ✅ What I Fixed:
- ✅ Added `/health` endpoint - test if backend alive
- ✅ Added `/api/health` - test if API responsive  
- ✅ Added `/api/debug/cors` - debug CORS issues
- ✅ Added `/api/debug/config` - see configuration
- ✅ Added request logging - see every request

### 🧪 TEST THIS NOW:

**In your browser:**
```
http://localhost:5003/health
http://localhost:5003/api/health
```

**Expected Result:**
```json
{"status": "ok", "message": "Backend is alive and responding"}
```

**If you see:**
- ✅ JSON response → Backend working ✅
- ❌ Connection refused → Start backend: `node server.js`
- ❌ Cannot GET / → Wrong port or path
- ❌ 404 Not Found → Endpoint doesn't exist

**For Production (Railway):**
```
https://your-backend-domain/health
https://your-backend-domain/api/health
```

If doesn't work on Railway:
1. Check Railway dashboard - is deployment active?
2. Check logs for errors
3. Backend might be sleeping (Railway free tier)
4. Wake it up by visiting URL
5. Increase timeout to 60000ms

---

## 🔴 Issue 2: CORS Blocking Requests

### ✅ What I Fixed:
- ✅ Temporarily set CORS to allow ALL origins for testing
- ✅ Added CORS preflight handling (`app.options('*', cors())`)
- ✅ Added better error messages for CORS errors
- ✅ Debug endpoint shows CORS status

### 🧪 TEST THIS NOW:

**Check what origins are allowed:**
```
http://localhost:5003/api/debug/cors
```

**Expected Response:**
```json
{
  "origin": "http://localhost:5175",
  "cors_allowed_origins": [
    "http://localhost:5174",
    "http://localhost:5173",
    "http://localhost:5003",
    ...
  ],
  "request_headers": {...}
}
```

**Browser Console Should Show:**
```
✅ [API] ✅ POST ... succeeded

OR

❌ [API Error] CORS Error: Cross-Origin Request Blocked
```

### If CORS Still Blocks:

**Open DevTools (F12) → Console**

Look for error like:
```
Access to XMLHttpRequest at 'https://backend.com/api/send-mail'
from origin 'https://frontend.com' has been blocked by CORS policy
```

**Quick Fix:**
1. Add your frontend domain to `backend/server.js` allowedOrigins:
   ```javascript
   const allowedOrigins = [
     'https://your-frontend-domain.com',
     'https://your-backend-domain.com',
     ...existing...
   ];
   ```

2. Restart backend

3. Test again

---

## 🔴 Issue 3: Wrong API URL in Frontend

### ✅ What I Fixed:
- ✅ Added logging to show which API URL is being used
- ✅ Checks environment variable first
- ✅ Shows correct URL in browser console
- ✅ Better error messages showing the URL being used

### 🧪 TEST THIS NOW:

**Open Browser DevTools (F12)**
- Go to Console tab
- Look for: `[API Configuration] Base URL: ...`

**Should Show One Of:**
```
✅ [API Configuration] Base URL: http://localhost:5003          (Local)
✅ [API Configuration] Base URL: http://192.168.x.x:5003        (LAN)
✅ [API Configuration] Base URL: https://your-backend.org       (Production)

❌ [API Configuration] Base URL: localhost:3000 (WRONG)
❌ [API Configuration] Base URL: undefined (WRONG)
```

### If Wrong URL:

**For Development:**
```env
.env.local:
VITE_API_URL=http://localhost:5003
```

**For Production:**
```env
.env.local:
VITE_API_URL=https://your-backend-domain.com
```

**Then:**
```bash
# Vite will automatically reload
# Check console again for new URL
```

---

## 🔴 Issue 4: HTTPS / Mixed Content

### ✅ Current Status:
- ✅ Frontend supports HTTPS
- ✅ Backend supports HTTPS  
- ✅ `getApiBaseUrl()` respects protocol

### 🧪 TEST THIS NOW:

**Check current protocol:**
```
Browser address bar shows:
https://your-site.com  ✅ Good
http://your-site.com   ⚠️  Not encrypted
```

**If using HTTPS frontend but HTTP backend:**
```
Browser blocks request → "Failed to fetch"
```

**Fix:**
```
Frontend: https://...
Backend:  https://...  (both must match)

.env.local:
VITE_API_URL=https://your-backend.com
```

**For Local Development:**
```
Frontend: http://localhost:5175
Backend:  http://localhost:5003
Both HTTP is OK for local testing
```

---

## 🔴 Issue 5: Backend Route Mismatch

### ✅ Available Routes:

**Health Checks:**
```
GET /health
GET /api/health
```

**Booking Form:**
```
POST /api/send-mail        ← Frontend sends here
Returns: { success, inquiryId, emailStatus }
```

**Admin Panel:**
```
GET /api/inquiries         ← Admin page loads this
GET /api/admins            ← Admin page loads this
GET /api/inquiries/:id     ← Get specific inquiry
```

**Payment:**
```
POST /api/create-payment   ← Payment form sends here
POST /api/payment-callback ← PhonePe sends here
```

**Debug:**
```
GET /api/debug/cors        ← Debug CORS
GET /api/debug/config      ← Debug configuration
```

### 🧪 TEST THIS NOW:

**Test each endpoint:**
```bash
# Health
curl http://localhost:5003/health
curl http://localhost:5003/api/health

# Get all inquiries
curl http://localhost:5003/api/inquiries

# Get admins
curl http://localhost:5003/api/admins

# Debug
curl http://localhost:5003/api/debug/cors
curl http://localhost:5003/api/debug/config
```

**All should return JSON, not 404**

---

## 📋 SUPER IMPORTANT DEBUG STEPS

### Step 1: Test Backend Directly
```bash
# Open Command Prompt and run:
curl http://localhost:5003/health

# OR open in browser:
http://localhost:5003/health

Response should be JSON with status: "ok"
```

### Step 2: Test from Frontend Console
```
1. Open http://localhost:5175
2. Press F12 (DevTools)
3. Go to Console tab
4. You should see:
   [API Configuration] Base URL: http://localhost:5003
```

### Step 3: Test Booking Form
```
1. Go to http://localhost:5175/contact
2. Fill form and submit
3. In DevTools Console, look for:
   [API] POST http://localhost:5003/api/send-mail
   [API] ✅ POST ... succeeded
4. Should show: ✓ Inquiry Received!
```

### Step 4: Check Network Tab
```
1. DevTools → Network tab
2. Make a booking request
3. Look for: POST /api/send-mail
4. Click it and check:
   - Request URL: should be correct backend
   - Request Headers: look for Origin header
   - Response Status: should be 200
   - Response Body: should have success: true
```

### Step 5: If CORS Error in Console
```
Copy the exact error message from:
DevTools → Console

Error should look like:
"Access to XMLHttpRequest at 'https://backend.com/api/send-mail'
from origin 'https://frontend.com' has been blocked by CORS policy"

This means backend doesn't allow frontend origin
```

---

## 🚀 Complete Setup Checklist

Before going live, verify:

```
[ ] Backend running: node server.js
    ✅ Shows: "Backend server running on port 5003"

[ ] http://localhost:5003/health responds with JSON

[ ] Frontend running: npm run dev
    ✅ Shows: "Local: http://localhost:5175"

[ ] DevTools Console shows:
    "[API Configuration] Base URL: http://localhost:5003"

[ ] Booking form works:
    Submit → See "✓ Inquiry Received!"

[ ] Admin page works:
    Shows list of inquiries

[ ] Email received:
    Check email for confirmation

[ ] From another device:
    http://192.168.x.x:5175 works

[ ] No errors in DevTools Console

[ ] No errors in browser Network tab

[ ] Backend console shows:
    "[2026-03-30...] POST /api/send-mail"
    "[2026-03-30...] Admin email sent successfully"
    "[2026-03-30...] User email sent successfully"
```

---

## 🔧 Quick Debugging Commands

```bash
# Check if port 5003 is listening
netstat -ano | findstr :5003

# Kill backend if stuck
taskkill /IM node.exe /F

# Start backend fresh
cd backend && node server.js

# Check if frontend can reach backend
curl http://localhost:5003/api/health

# Check console logs during submission
# (DevTools → Console tab will show [API] logs)
```

---

## 📸 WHEN TO SHARE SCREENSHOTS

Send me a screenshot of:

1. **DevTools Console** (F12 → Console)
   - [API] logs
   - Any error messages
   - Full error text

2. **Network Tab** (F12 → Network)
   - POST request to /api/send-mail
   - Response status
   - Response headers and body

3. **Backend Console Output**
   - Full startup messages
   - Request logs during booking
   - Any errors

4. **The Error**
   - Full error message
   - What were you doing
   - What device/network

---

## ✨ All Debug URLs Quick Reference

```
http://localhost:5003/health              ← Backend alive?
http://localhost:5003/api/health          ← API alive?
http://localhost:5003/api/debug/cors      ← CORS config?
http://localhost:5003/api/debug/config    ← Backend config?
http://localhost:5003/api/inquiries       ← All inquiries
http://localhost:5003/api/admins          ← All admins
http://localhost:5175 or :5174            ← Frontend
http://localhost:5175/contact             ← Booking form
http://localhost:5175/admin               ← Admin panel
```

---

## 🎯 Summary

| Issue | What I Fixed | How to Test |
|-------|-------------|-----------|
| **Backend not reachable** | Added `/health` endpoints | Visit `http://localhost:5003/health` |
| **CORS blocking** | Set to allow all origins temporarily | Check `/api/debug/cors` |
| **Wrong API URL** | Added logging, checks env var | Check DevTools console |
| **HTTPS/Mixed Content** | Already supported | Check protocol in both URLs |
| **Route mismatch** | Verified all routes exist | Test each endpoint |

---

## 🚀 You're NOW Ready!

✅ Everything is set up for debugging
✅ Error messages are helpful
✅ Debug endpoints are active
✅ Logging is enabled
✅ Ready to test

**Next: Test from your browser and send me any errors you see!**
