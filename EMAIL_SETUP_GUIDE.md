# Email Setup Guide - Resend API Configuration

## Problem
The backend is configured to use **Resend** for sending emails, but the API key is **invalid**.

```
❌ API key is invalid
```

## Solution

### Step 1: Get a Valid Resend API Key

1. Go to **https://resend.com** and sign up/log in
2. Navigate to **Tokens** or **API Keys** section
3. Create a new API token
4. Copy the token (it starts with `re_`)

### Step 2: Update Backend Configuration

#### For Local Development:
Create or update `backend/.env.local`:
```env
RESEND_API_KEY=re_YOUR_ACTUAL_API_KEY_HERE
```

Or update `backend/.env`:
```env
RESEND_API_KEY=re_YOUR_ACTUAL_API_KEY_HERE
MAIL_FROM=bookings@doctorsfarms.in
MAIL_PROVIDER=resend
```

#### For Production (Railway):
1. Go to your Railway Dashboard
2. Select the **backend service**
3. Go to **Environment** section
4. Add/Update: `RESEND_API_KEY=re_YOUR_ACTUAL_API_KEY_HERE`
5. Redeploy

### Step 3: Verify Domain (Optional but Recommended)

For production emails, verify your domain with Resend:
1. In Resend Dashboard, go to **Domains**
2. Add your domain `doctorsfarms.in`
3. Follow the verification steps (add CNAME records)
4. Once verified, update `MAIL_FROM=bookings@doctorsfarms.in`

### Step 4: Test Email Sending

After updating the API key, restart the backend:
```bash
cd backend
npm start
```

Then test by submitting an inquiry through the form. You should receive:
- ✅ Email to customer (confirmation)
- ✅ Email to admin (notification)

## Fallback Sender

If the domain `bookings@doctorsfarms.in` is not verified, the system will automatically fall back to `doctorsfarms686@gmail.com` (the verified contact email).

## Current Status

✅ Admin page now using proper `apiFetch()` with fallback logic
✅ Email sending has retry mechanism with fallback sender
❌ API key is invalid - **ACTION REQUIRED**: Update with valid Resend API key

## Next Steps

1. Update the RESEND_API_KEY with a valid key
2. Restart the backend (for local testing) or redeploy on Railway
3. Test by submitting an inquiry
4. Verify emails arrive in inbox
