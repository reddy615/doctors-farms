# Railway Environment Variables - Single Project Setup Guide

## 🚀 Step-by-Step Instructions

### STEP 1: Single Combined Project Setup

1. Go to: https://railway.com/project/92076709-fa5f-4e9a-a2c7-0c63bd12cec1/service/c4b3b1ff-b364-472a-93be-12a0e3704886/settings
2. In the **"Build"** section, set:
   - **Build Command**: `npm run build && (cd backend && npm install)`
3. In the **"Deploy"** section, set:
   - **Start Command**: `node backend/server.js`
4. Click: **Variables** (in the sidebar)
5. Add these variables (copy-paste exactly):

```
SMTP_HOST
smtp.gmail.com

SMTP_PORT
587

SMTP_USER
doctorsfarms686@gmail.com

SMTP_PASS
[YOUR GMAIL APP PASSWORD - see below]

CONTACT_EMAIL
doctorsfarms686@gmail.com

ADMIN_LIST
doctorsfarms686@gmail.com

FRONTEND_URL
https://doctors-farms-production.up.railway.app

BACKEND_URL
https://doctors-farms-backend.up.railway.app

NODE_ENV
production

VITE_API_URL
https://doctors-farms-backend.up.railway.app
```

### STEP 2: Get Gmail App Password

1. Go to: https://myaccount.google.com/
2. Click: **Security** (left sidebar)
3. Enable: **2-Step Verification** (if not already enabled)
4. Find: **App Passwords** (appears after 2FA is on)
5. Select: **Mail** and **Windows Computer**
6. Copy: The 16-character password
7. Paste: As `SMTP_PASS` value in Railway

### STEP 3: Deploy Your Project

1. Click: **Deploy** button (top right of your Railway project)
2. Wait: 2-3 minutes for deployment

### STEP 4: Test Production

1. Visit: https://doctors-farms-production.up.railway.app
2. Open: F12 (DevTools) → Console
3. Look for: `✅ [API Config] Using VITE_API_URL: https://doctors-farms-backend.up.railway.app`
4. Fill booking form
5. Click: Send Inquiry
6. Should see: "✓ Inquiry Received!"

---

## 📋 Quick Checklist

- [ ] Set Build Command: `npm run build && (cd backend && npm install)`
- [ ] Set Start Command: `node backend/server.js`
- [ ] Added all SMTP variables (SMTP_HOST, SMTP_USER, SMTP_PASS)
- [ ] Set CONTACT_EMAIL & ADMIN_LIST
- [ ] Set VITE_API_URL
- [ ] Clicked Deploy (wait 2-3 min)
- [ ] Tested: Form submission works
- [ ] Tested: Console shows correct backend URL
- [ ] Tested: Received email confirmation

---

## 🔧 If Something Goes Wrong

**Console shows: "❌ CRITICAL: VITE_API_URL not set"**
→ Variables not applied
→ Click Deploy again on your Railway project

**Email not sending**
→ Check SMTP_USER & SMTP_PASS in your Railway project variables
→ Verify Gmail app password (not regular password)
→ Check Railway logs for error

**API calls show localhost**
→ Hard refresh browser: **Ctrl+Shift+R** (not just Ctrl+R)

**Still failing?**
→ Check Railway logs → look for errors
→ Check `/api/debug/config` endpoint
→ Share exact error message

---

## 📩 Gmail App Password Process (Detailed)

If 2-Step Verification is not enabled:
1. https://myaccount.google.com/ → Security
2. Click "Enable 2-Step Verification"
3. Verify your phone
4. Then go to App Passwords (will appear)

Once you have App Passwords:
1. Device: Select **Mail**
2. Platform: Select **Windows Computer** (or your OS)
3. Google generates 16-character password
4. Copy it: **xxxxxxxx xxxxxxxx** (with space)
5. Use in Railway as: **xxxxxxxxxxxxxxxx** (remove space)

---

## ✅ All Variables Reference

**Single Project (10 variables):**
- SMTP_HOST=smtp.gmail.com
- SMTP_PORT=587
- SMTP_USER=doctorsfarms686@gmail.com
- SMTP_PASS=<app-password>
- CONTACT_EMAIL=doctorsfarms686@gmail.com
- ADMIN_LIST=doctorsfarms686@gmail.com
- FRONTEND_URL=https://doctors-farms-production.up.railway.app
- BACKEND_URL=https://doctors-farms-backend.up.railway.app
- NODE_ENV=production
- VITE_API_URL=https://doctors-farms-backend.up.railway.app

---

Good luck! Once deployed, your production site will work perfectly! 🚀
