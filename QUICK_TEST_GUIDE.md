# 🚀 Quick Start - Backend Testing & Debugging

## ✅ Current Status

```
✅ Backend:  http://localhost:5003
✅ Frontend: http://localhost:5175 (or 5173/5174)
✅ SMTP:     Verified and working
✅ CORS:     Configured to allow all origins for testing
```

---

## 🔗 Health Check URLs (Test These NOW)

### Test Backend is Alive
```
http://localhost:5003/health
http://localhost:5003/api/health
```

**You should see:**
```json
{
  "status": "ok",
  "message": "Backend is alive and responding",
  "timestamp": "2026-03-30T...",
  "version": "1.0.0"
}
```

---

## 🔧 Debug Endpoints (Troubleshooting)

### 1. Check CORS Configuration
```
http://localhost:5003/api/debug/cors

Shows:
- What origin sent the request
- Allowed origins list
- Current frontend/backend URLs
- All headers
```

### 2. Check Backend Configuration
```
http://localhost:5003/api/debug/config

Shows:
- Frontend URL
- Backend URL
- PhonePe environment
- SMTP status
- Admin emails
```

### 3. List All Available Routes
```
http://localhost:5003/api/health

Shows:
- All available endpoints
- Current configuration
```

---

## 📋 Testing Steps

### Step 1: Verify Backend Responds
```bash
# In PowerShell or Command Prompt:
curl http://localhost:5003/health

# Or open in browser:
http://localhost:5003/health
https://localhost:5003/api/health
```

### Step 2: Check DevTools Console
```
1. Open Frontend: http://localhost:5175
2. Press F12 (Open DevTools)
3. Go to Console tab
4. Look for logs starting with [API Configuration]
5. Should show: Base URL: http://localhost:5003
```

### Step 3: Test Booking Form
```
1. Go to http://localhost:5175/contact
2. Fill the form and click "Send Inquiry"
3. Check DevTools Console for:
   - [API] POST http://localhost:5003/api/send-mail
   - [API] ✅ POST ... succeeded
4. Should show: ✓ Inquiry Received! Inquiry ID: INQ_...
```

### Step 4: Check Admin Panel
```
1. Visit http://localhost:5175/admin
2. Should load inquiries and admins list
3. Recent inquiries shown in table
```

---

## 🧪 Common Test Scenarios

### Test 1: Local Development
```
Frontend:    http://localhost:5175
Backend API: http://localhost:5003

Expected: Everything works
```

### Test 2: From Another Device (LAN)
```
1. Find laptop IP:  ipconfig (look for IPv4 Address)
   Example: 192.168.1.100

2. From other device:
   http://192.168.1.100:5175

3. Expected: Booking works, emails sent
```

### Test 3: Production URLs
```
Set in .env.local:
VITE_API_URL=https://doctors-farms-backend.up.railway.app

Check DevTools:
[API Configuration] Base URL: https://doctors-farms-backend.up.railway.app
```

---

## 🔍 Debug Console Output

### Good Output (Works)
```
🔑 [API Configuration]
   Base URL: http://localhost:5003
   Environment: development
   VITE_API_URL set: false

[API] POST http://localhost:5003/api/send-mail
[API] ✅ POST ... succeeded

Response: {
  success: true,
  inquiryId: "INQ_...",
  emailStatus: "sent"
}
```

### Bad Output (Errors)

**Backend not running:**
```
[API Error] Failed to fetch: Cannot reach server at http://localhost:5003

Possible causes:
• Backend server is not running
• Incorrect backend URL: http://localhost:5003
• Network connectivity issue
• CORS policy blocking the request
```

**CORS blocked:**
```
[API Error] CORS Error: Cross-Origin Request Blocked

Browser console also shows:
Access to XMLHttpRequest ... has been blocked by CORS policy
```

**Wrong API URL:**
```
[API Configuration] Base URL: localhost:3000  ❌ WRONG!

Should be: http://localhost:5003
```

---

## 🚨 Quick Fixes

### If Backend Not Responding
```powershell
# Kill any process on 5003
taskkill /IM node.exe /F

# Restart backend
cd backend
node server.js
```

### If Frontend Has Wrong URL
```bash
# Check current setting
type .env.local  # Should show VITE_API_URL

# Update if needed
VITE_API_URL=http://localhost:5003

# Restart frontend (Vite will hot-reload)
```

### If CORS Still Blocking
```
1. Backend CORS is set to allow all origins currently
2. So this shouldn't happen in development
3. If it does, check DevTools for exact error
4. Share screenshot of error → I'll fix instantly
```

---

## 📸 What to Share If Errors

Send me:
1. Screenshot of DevTools Console (F12)
2. Screenshot of Network tab showing failed request
3. Full backend console output
4. What command you used to start backend
5. Output of: `curl http://localhost:5003/health`

---

## 📚 Files Modified

```
✅ backend/server.js
   - Added health check endpoints (/health, /api/health)
   - Improved CORS configuration with logging
   - Added debug endpoints (/api/debug/cors, /api/debug/config)
   - Added request logging middleware
   - Better formatted console output

✅ src/config/api.ts
   - Added timeout handling (30s)
   - Better error messages
   - Request logging
   - CORS error detection
   - Timeout error detection

✅ BACKEND_DEBUG_GUIDE.md (New)
   - Complete debugging guide
   - Common issues and fixes
   - Testing procedures
   - Advanced troubleshooting
```

---

## ✨ What's Ready to Test

| Feature | Status | How to Test |
|---------|--------|-----------|
| **Health Check** | ✅ | Visit `/health` endpoint |
| **CORS Debug** | ✅ | Visit `/api/debug/cors` |
| **Config Debug** | ✅ | Visit `/api/debug/config` |
| **Booking Form** | ✅ | Submit inquiry form |
| **Email Sending** | ✅ | Check logs for "email sent" |
| **Admin Panel** | ✅ | View `/admin` page |
| **Error Messages** | ✅ | Check console for helpful errors |

---

## 🎯 Next Steps

1. **Test locally**
   ```bash
   # Both servers running - they should be now
   # Backend: :5003
   # Frontend: :5175
   ```

2. **Open DevTools and test**
   ```
   F12 → Console
   Go to contact form
   Submit inquiry
   Look for [API] logs
   ```

3. **If errors in console**
   ```
   Note the exact error message
   Check CORS or timeout indicators
   Send me screenshot
   I'll fix immediately
   ```

4. **Test from another device**
   ```
   Use your laptop IP
   http://192.168.x.x:5175
   Should work the same way
   ```

---

## 🔗 All Debug URLs Summary

| URL | Purpose | Response |
|-----|---------|----------|
| `/health` | Check if backend alive | `{status: "ok"}` |
| `/api/health` | Check API alive | `{status: "ok", version: "1.0.0"}` |
| `/api/debug/cors` | Check CORS config | Shows allowed origins |
| `/api/debug/config` | Check configuration | Shows all settings |
| `/api/inquiries` | Get all inquiries | JSON list |
| `/api/admins` | Get admin list | JSON list |
| `/api/send-mail` | Create inquiry | Creates new inquiry |

---

## 💡 Pro Tips

1. **Always check browser Console first** (F12)
   - Most errors show there
   - Copy exact error message

2. **Check Network tab** (F12 → Network)
   - See actual request URL
   - Check response status
   - Look for CORS headers

3. **Use `/api/debug/cors`**
   - See what backend knows about your request
   - Helps identify CORS issues

4. **Check backend console**
   - Shows request logs
   - Shows email sending status
   - Shows any errors

---

## ⚡ You're All Set!

Everything is now:
- ✅ Running
- ✅ Debugging enabled
- ✅ Error messages improved
- ✅ CORS configured
- ✅ Ready to test

**Open browser and start testing!**
