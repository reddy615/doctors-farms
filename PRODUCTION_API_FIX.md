# Complete API Issue Diagnosis & Fix

## 🚨 Current Symptoms

✅ Works on your laptop
❌ Fails on other devices / production
❌ Error: "Failed to send inquiry: Unable to send inquiry."

---

## 🔍 Root Cause Analysis (3 Possible Issues)

### **Issue #1: SMTP Not Configured on Railway (Most Likely)**

**How to verify:**
1. Open Railway Dashboard → Backend Project
2. Click "Variables"
3. Check if these exist:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=doctorsfarms686@gmail.com
   SMTP_PASS=<app-password>
   ```

**If missing:** The backend returns:
```json
{"success": false, "error": "Mail service is not configured."}
```

**Fix:**
```bash
# In Railway Dashboard → Backend → Variables → Add:
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = doctorsfarms686@gmail.com
SMTP_PASS = your-gmail-app-password
CONTACT_EMAIL = doctorsfarms686@gmail.com
```

Then **Manual Redeploy** (click Deploy button)

---

### **Issue #2: Frontend Calling Wrong URL**

**How to verify on production device (Mobile):**

1. Open your production site: https://doctors-farms-production.up.railway.app
2. Press F12 → **Console** tab
3. Look for log line:
   ```
   🔧 [API Configuration]
      Base URL: ???
      Environment: production
   ```

**What it should show:**
```
Base URL: https://doctors-farms-backend.up.railway.app ✅ CORRECT
```

**What it shows if wrong:**
```
Base URL: http://localhost:5003 ❌ WRONG
```

**If showing localhost:**
1. Go to Railway Dashboard → Frontend Project
2. Click **Variables**
3. Add/Update:
   ```
   VITE_API_URL = https://doctors-farms-backend.up.railway.app
   ```
4. **Manual Redeploy** (click Deploy button)
5. Hard refresh: **Ctrl+Shift+R** (not just Ctrl+R)

---

### **Issue #3: CORS Blocking Request**

**How to verify:**

1. Mobile device → https://doctors-farms-production.up.railway.app
2. Press F12 → **Network** tab
3. Click "Send Inquiry"
4. Find the failed request → click it
5. Look for error like:
   ```
   Access to fetch at 'https://...' from origin '...' 
   has been blocked by CORS policy
   ```

**If CORS error:**
- Backend's CORS configuration needs frontend origin added
- Check `backend/server.js` line ~20 for `allowedOrigins`

**Fix in backend/server.js:**
```javascript
const allowedOrigins = [
  'https://doctors-farms-production.up.railway.app',  // Add this
  'http://localhost:5174',
  // ... other origins
];
```

---

## ✅ Complete Fix Checklist

### **Step 1: Backend SMTP Configuration (Railway)**

```bash
Go to: Railway Dashboard → Backend Project → Variables

Add these:
SMTP_HOST         = smtp.gmail.com
SMTP_PORT         = 587
SMTP_SECURE       = false
SMTP_USER         = doctorsfarms686@gmail.com
SMTP_PASS         = your-gmail-app-password
CONTACT_EMAIL     = doctorsfarms686@gmail.com
ADMIN_LIST        = doctorsfarms686@gmail.com
FRONTEND_URL      = https://doctors-farms-production.up.railway.app
BACKEND_URL       = https://doctors-farms-backend.up.railway.app
NODE_ENV          = production
```

**How to get Gmail App Password:**
1. Go to: https://myaccount.google.com/
2. Security → 2-Step Verification → App Passwords
3. Select "Mail" → "Windows Computer"
4. Copy the 16-character password
5. Paste as SMTP_PASS in Railway

### **Step 2: Frontend Environment Configuration (Railway)**

```bash
Go to: Railway Dashboard → Frontend Project → Variables

Add:
VITE_API_URL = https://doctors-farms-backend.up.railway.app
```

### **Step 3: Manual Redeploy Both Projects**

1. Backend: Click **Deploy** button (wait 2-3 min)
2. Frontend: Click **Deploy** button (wait 2-3 min)
3. Hard refresh frontend: **Ctrl+Shift+R**

---

## 🧪 Test After Fixes

### **Local Test (Your Laptop)**

```bash
cd backend && node server.js
# Should show: ✅ SMTP transporter verified successfully

npm run dev
# On http://localhost:5174, try sending inquiry
# Should work ✅
```

### **Production Test (Mobile/Friend's Device)**

1. **Visit:** https://doctors-farms-production.up.railway.app
2. **Open Console (F12):** Should show:
   ```
   🔧 [API Configuration]
      Base URL: https://doctors-farms-backend.up.railway.app ✅
      Environment: production
   ```
3. **Open Network tab (F12)**
4. **Fill booking form and click "Send Inquiry"**
5. **Check request:**
   - URL should be: `https://doctors-farms-backend.up.railway.app/api/send-mail` ✅
   - Request method: POST ✅
   - Status: 200 OK ✅

### **Check Backend Logs (Railway)**

1. Railway Dashboard → Backend Project
2. Click **Logs** tab
3. Click "Send Inquiry" on production site
4. Look for:
   ```
   ✅ SMTP transporter verified successfully
   📧 /api/send-mail request received
   Attempting to send admin email...
   Admin email sent successfully
   ```

If you see **errors** instead, note them and we'll debug.

---

## 🔧 Debug Backend Routes

### **Verify All Routes Exist**

```bash
# Test from backend server logs or Railway logs
# You should see all these routes initialized:
/health
/api/health
/api/debug/cors
/api/debug/config
/api/send-mail (POST)
/api/inquiries (GET)
/api/admins (GET)
/api/create-payment (POST)
```

---

## 💡 Why It Works Locally But Not on Production

| Item | Local | Production |
|------|-------|------------|
| **SMTP Variables** | Set in `.env.local` ✅ | Need to set in Railway Dashboard ❌ |
| **Frontend API URL** | Uses localhost:5003 | Must use VITE_API_URL ❌ |
| **CORS** | Allows localhost | Must allow production domain |
| **TLS/HTTPS** | Not needed (HTTP) | Required ✅ |

---

## 📊 Decision Tree

```
Send Inquiry fails on production?
│
├─ Check console logs: Base URL showing localhost?
│  ├─ YES → Set VITE_API_URL in Railway Frontend
│  └─ NO → Continue to next check
│
├─ Check Network tab: CORS error?
│  ├─ YES → Add frontend URL to backend CORS allowedOrigins
│  └─ NO → Continue to next check
│
├─ Check Railway Backend logs: SMTP error?
│  ├─ YES → Configure SMTP variables in Railway Backend
│  ├─ No transporter → Same as above
│  └─ NO → Continue to next check
│
└─ Cannot find issue → Enable debug mode below
```

---

## 🐛 Enable Debug Mode (Advanced)

To see detailed error logs, add this to `backend/server.js` around line 195:

```javascript
app.post('/api/send-mail', async (req, res) => {
  console.log('📧 [DETAILED DEBUG] /api/send-mail request received');
  console.log('   Transporter exists:', !!transporter);
  console.log('   Request body keys:', Object.keys(req.body));
  console.log('   SMTP_USER:', process.env.SMTP_USER ? 'Set ✅' : 'NOT SET ❌');
  console.log('   SMTP_PASS:', process.env.SMTP_PASS ? 'Set ✅' : 'NOT SET ❌');
  console.log('   SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  
  // ... rest of the route code
```

Then check **Railway Backend Logs** to see detailed debug info

---

## ✨ Quick Summary

| Fix | Priority | Time |
|-----|----------|------|
| Set SMTP variables in Railway Backend | 🔴 HIGH | 2 min |
| Set VITE_API_URL in Railway Frontend | 🔴 HIGH | 2 min |
| Manual Redeploy both | 🔴 HIGH | 5 min |
| Test on mobile | 🟡 MEDIUM | 3 min |
| Check Railway logs if still failing | 🟡 MEDIUM | 5 min |

---

## 🎯 Most Likely Fix (Based on Your Symptoms)

Your backend is crashing or not properly configured on Railway because:

1. **SMTP variables not set** → Backend fails to send emails
2. **Frontend still calling localhost** → Can't reach backend at all

**Do this now:**

1. Railway Dashboard → Backend → Variables → **Add SMTP variables**
2. Railway Dashboard → Frontend → Variables → **Set VITE_API_URL**
3. Click **Deploy** on both
4. Test on mobile device

**That's it!** 90% chance this fixes your issue. ✨

---

## Need Help?

If still failing after all above steps:
1. Share screenshot of Railway Backend Logs
2. Share screenshot of browser Console (F12)
3. Share screenshot of Network tab (failed request details)
4. We'll debug from there!
