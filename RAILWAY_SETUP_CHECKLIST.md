# Railway Environment Variables - Quick Setup Guide

## 🚀 Step-by-Step Instructions

### STEP 1: Backend Project (Email Configuration)

1. Go to: https://railway.app
2. Select: **Backend Project** (doctors-farms-backend)
3. Click: **Variables** (in the sidebar)
4. Add these variables (copy-paste exactly):

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
```

### STEP 2: Get Gmail App Password

1. Go to: https://myaccount.google.com/
2. Click: **Security** (left sidebar)
3. Enable: **2-Step Verification** (if not already enabled)
4. Find: **App Passwords** (appears after 2FA is on)
5. Select: **Mail** and **Windows Computer**
6. Copy: The 16-character password
7. Paste: As `SMTP_PASS` value in Railway

### STEP 3: Frontend Project (API Configuration)

1. Go to: https://railway.app
2. Select: **Frontend Project** (doctors-farms-production)
3. Click: **Variables**
4. Add this variable:

```
VITE_API_URL
https://doctors-farms-backend.up.railway.app
```

### STEP 4: Deploy Both Projects

1. Go to: Backend Project
2. Click: **Deploy** button (top right)
3. Wait: 2-3 minutes for deployment
4. Go to: Frontend Project  
5. Click: **Deploy** button (top right)
6. Wait: 2-3 minutes for deployment

### STEP 5: Test Production

1. Visit: https://doctors-farms-production.up.railway.app
2. Open: F12 (DevTools) → Console
3. Look for: `✅ [API Config] Using VITE_API_URL: https://doctors-farms-backend.up.railway.app`
4. Fill booking form
5. Click: Send Inquiry
6. Should see: "✓ Inquiry Received!"

---

## 📋 Quick Checklist

- [ ] Backend: Added SMTP_HOST, SMTP_USER, SMTP_PASS
- [ ] Backend: Set CONTACT_EMAIL & ADMIN_LIST
- [ ] Backend: Clicked Deploy (wait 2-3 min)
- [ ] Frontend: Added VITE_API_URL
- [ ] Frontend: Clicked Deploy (wait 2-3 min)
- [ ] Tested: Form submission works
- [ ] Tested: Console shows correct backend URL
- [ ] Tested: Received email confirmation

---

## 🔧 If Something Goes Wrong

**Console shows: "❌ CRITICAL: VITE_API_URL not set"**
→ Frontend variables not applied
→ Click Deploy again on Frontend

**Email not sending**
→ Check SMTP_USER & SMTP_PASS in Backend variables
→ Verify Gmail app password (not regular password)
→ Check Railway Backend Logs for error

**API calls show localhost**
→ Hard refresh browser: **Ctrl+Shift+R** (not just Ctrl+R)

**Still failing?**
→ Check Railway Backend Logs → look for errors
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

**Backend (8 variables):**
- SMTP_HOST=smtp.gmail.com
- SMTP_PORT=587
- SMTP_USER=doctorsfarms686@gmail.com
- SMTP_PASS=<app-password>
- CONTACT_EMAIL=doctorsfarms686@gmail.com
- ADMIN_LIST=doctorsfarms686@gmail.com
- FRONTEND_URL=https://doctors-farms-production.up.railway.app
- BACKEND_URL=https://doctors-farms-backend.up.railway.app
- NODE_ENV=production

**Frontend (1 variable):**
- VITE_API_URL=https://doctors-farms-backend.up.railway.app

---

Good luck! Once deployed, your production site will work perfectly! 🚀
