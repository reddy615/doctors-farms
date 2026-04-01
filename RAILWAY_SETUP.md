# 🚀 Railway Configuration - CRITICAL STEPS

## MUST DO RIGHT NOW

### Step 1: Update Backend Start Command
**This is the BLOCKER preventing emails from working**

1. Open: https://railway.app
2. Select: **Doctors Farms Backend** project
3. Click: **Settings** (top right)
4. Scroll to: **Deploy** section
5. Find: **Start Command** field
6. Change to: `npm start`
7. Click: **Save** or **Redeploy**

### Step 2: Set Environment Variables
1. In Railway Dashboard: Backend project → Variables
2. Add these exact variables:

```
NODE_ENV=production
EMAIL_USER=doctorsfarms686@gmail.com
EMAIL_PASS=[Your Gmail app password]
FRONTEND_URL=https://[your-backend-url].up.railway.app
PORT=5000
```

**Getting Gmail App Password:**
1. Go to: https://myaccount.google.com/apppasswords
2. Select: Mail + Windows Computer
3. Copy the 16-character password
4. Paste as `EMAIL_PASS`

### Step 3: Verify Backend is Running
After setting start command:
1. Railway redeploys
2. Check logs (should show):
   ```
   ✅ Backend server running on port 5000
   ✅ CORS Allowed Origins: [...]
   ✅ SMTP transporter configured
   ```

### Step 4: Test Booking Form
1. Go to: Your backend URL (e.g., `https://[your-backend].up.railway.app`)
2. Click: **Contact & Booking**
3. Fill form + Submit
4. Should see: "Inquiry received!"
5. Check email: `doctorsfarms686@gmail.com` for booking

---

## If Backend Still Falls (Check Logs)

### Scenario 1: Only "handled request" proxy logs
**Problem:** Backend app not starting  
**Solution:** 
1. Check Start Command is exactly: `npm start`
2. Check Package.json has: `"start": "node server.js"`
3. Try updating to: `node backend/server.js`

### Scenario 2: "Backend server running" appears, but forms still fail
**Problem:** SMTP not configured  
**Solution:**
1. Double-check EMAIL_USER and EMAIL_PASS
2. Verify Gmail app password (not regular password)
3. Check firewall/network isn't blocking port 587 (SMTP)

### Scenario 3: CORS errors in browser console
**Problem:** Frontend can't reach backend  
**Solution:**
1. Verify FRONTEND_URL matches your actual Railway URL
2. Check backend CORS settings in server.js
3. Manually test: `curl https://[your-backend]/api/health`

---

## Quick Verification Commands

Test locally before pushing to Railway:

```bash
# Terminal 1: Start backend
cd backend
npm install
npm start
# Should see: ✅ Backend server running on port 5000

# Terminal 2: Visit backend
curl http://localhost:5000/api/health
# Should return: {"status":"ok"}

# Terminal 3: Test form submission
curl -X POST http://localhost:5000/api/send-mail \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","phone":"1234567890","message":"Hello","stay":"2"}'
# Should return: {"success":true,"inquiryId":"...","emailStatus":"sent"}
```

---

## Expected Error Messages (Normal)

✅ These are OK and don't indicate problems:
- `⚠️  VITE_API_URL not set` — Frontend using relative paths (good!)
- `[nodemailer] trying port 587` — SMTP connection attempt
- `GET * 404` in logs — Just SPA routing, not an error

❌ These are PROBLEMS:
- `Cannot find module` — Missing dependency
- `connect ECONNREFUSED` — Backend can't connect (usually SMTP)
- `Server listened on undefined port` — Missing PORT variable
- `Start Command` says `npm start` but logs show nothing — Restart needed

---

## What Happens Behind the Scenes

1. **You submit form** on https://[backend].up.railway.app
2. **Frontend sends POST** to `/api/send-mail`
3. **Backend receives** at http://localhost:5000/api/send-mail
4. **Backend connects** to Gmail SMTP (port 587)
5. **Email sent** to doctorsfarms686@gmail.com
6. **Frontend shows** "Inquiry received!"

---

## Contact for Debugging

If logs still show issues after step 1-3:

1. **Check actual error message** in Railway logs
2. **Copy the error** (paste in message below)
3. **Tell me:**
   - What is the exact error shown?
   - Does it say "Backend server running"?
   - What does `curl https://[your-url]/api/health` return?

We'll fix it from there! 🚀

