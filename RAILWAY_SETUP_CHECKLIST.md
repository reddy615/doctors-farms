# Railway Environment Variables - Separate Deployments Setup

## 🚀 Step-by-Step Instructions

### STEP 1: Deploy Backend Separately

1. Go to: https://railway.app
2. Click: **New Project**
3. Select: **Deploy from GitHub**
4. Choose: Your doctors-farms repository
5. Set: **Root Directory** = `backend`
6. In **Settings** → **Build**:
   - **Build Command**: `npm install`
7. In **Settings** → **Deploy**:
   - **Start Command**: `node server.js`
8. In **Variables** tab, add:
   ```
   EMAIL_USER
   doctorsfarms686@gmail.com

   EMAIL_PASS
   [YOUR GMAIL APP PASSWORD]
   ```
9. Click: **Deploy**
10. Wait for deployment - you'll get a URL like: `https://doctors-farms-backend.up.railway.app`

### STEP 2: Deploy Frontend Separately

1. Go to: https://railway.app
2. Click: **New Project**
3. Select: **Deploy from GitHub**
4. Choose: Your doctors-farms repository
5. Set: **Root Directory** = (leave empty for root)
6. In **Variables** tab, add:
   ```
   VITE_API_URL
   https://doctors-farms-backend.up.railway.app
   ```
7. Click: **Deploy**
8. Wait for deployment - you'll get a URL like: `https://doctors-farms-production.up.railway.app`

### STEP 3: Test Production

1. Visit: Your frontend Railway URL
2. Open: F12 (DevTools) → Console
3. Look for: `✅ [API Config] Using VITE_API_URL: https://doctors-farms-backend.up.railway.app`
4. Fill booking form and submit
5. Should work and send emails!

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

- [ ] Backend: Created separate Railway project with root directory = backend
- [ ] Backend: Set Build Command = npm install
- [ ] Backend: Set Start Command = node server.js
- [ ] Backend: Added EMAIL_USER and EMAIL_PASS variables
- [ ] Backend: Deployed successfully (note the URL)
- [ ] Frontend: Created separate Railway project with root directory = (empty)
- [ ] Frontend: Added VITE_API_URL pointing to backend URL
- [ ] Frontend: Deployed successfully
- [ ] Tested: Form submission works
- [ ] Tested: Console shows correct backend URL
- [ ] Tested: Received email confirmation

---

## 🔧 If Something Goes Wrong

**Console shows: "❌ CRITICAL: VITE_API_URL not set"**
→ Frontend variables not applied
→ Check frontend Railway project variables

**Email not sending**
→ Check EMAIL_USER & EMAIL_PASS in backend Railway project
→ Verify Gmail app password (not regular password)
→ Check backend Railway logs for errors

**API calls show localhost**
→ Hard refresh browser: **Ctrl+Shift+R** (not just Ctrl+R)

**Backend not deploying**
→ Check backend Railway logs
→ Ensure root directory is set to "backend"
→ Verify EMAIL_USER and EMAIL_PASS are set

**Frontend not deploying**
→ Check frontend Railway logs
→ Ensure VITE_API_URL points to your backend URL

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

## ✅ Variables Reference

**Backend Project:**
- EMAIL_USER=doctorsfarms686@gmail.com
- EMAIL_PASS=<gmail-app-password>

**Frontend Project:**
- VITE_API_URL=https://your-backend-railway-url

---

Good luck! Once deployed, your production site will work perfectly! 🚀
