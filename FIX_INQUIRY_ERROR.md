# Fix for "Failed to fetch" Inquiry Error

## Problem Summary

The booking form was failing on all devices except your laptop because:
- Frontend had hardcoded `http://localhost:5003` URLs
- On your laptop: `localhost:5003` = your laptop's backend server ✓
- On other devices: `localhost:5003` = that device's localhost (no server there) ✗

Result: **"Failed to fetch" error on all other devices**

---

## Solution Implemented

### 1. Created Dynamic API Configuration (`src/config/api.ts`)

This file automatically determines the correct API URL based on environment:
- **Development**: Uses current hostname with port 5003
- **Production**: Uses environment variable or current origin
- **Custom hosts**: Works with IP addresses and domain names

### 2. Updated Frontend (`src/pages/Contact.tsx`)

Replaced hardcoded URLs with dynamic API endpoint configuration:
```typescript
// Before (broken):
fetch('http://localhost:5003/api/send-mail', {...})

// After (fixed):
fetch(getApiEndpoint('/api/send-mail'), {...})
```

### 3. Environment Configuration Files

Created configuration files to allow easy setup for different environments:

**`.env.local`** (Development - not committed to git):
```env
# Leave empty for auto-detection, or set specific URL
# VITE_API_URL=http://localhost:5003
```

**`.env.example`** (Reference for team):
```env
# Examples of different environment configurations
```

---

## How to Configure for Different Scenarios

### Scenario 1: Local Development (Laptop to Laptop)
1. Ensure backend is running: `npm run dev` in `backend/` directory
2. Run frontend: `npm run dev`
3. Access from same laptop: http://localhost:5174
4. Access from other device: Use your laptop's IP address instead of localhost:
   - Find your laptop IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Example: `http://192.168.x.x:5174`
   - This will now work✓

### Scenario 2: Remote Server/Deployment
Edit `.env.local`:
```env
VITE_API_URL=http://your-server-ip:5003
```
or for production domain:
```env
VITE_API_URL=https://api.doctorsfarms.com
```

### Scenario 3: Docker Deployment
Set environment variable when building/running:
```bash
docker build -e VITE_API_URL=http://docker-service:5003 .
```

---

## Testing the Fix

1. **On your laptop (local network test)**:
   ```
   Find your laptop IP: ipconfig (Windows)
   Example output: IPv4 Address: 192.168.x.x
   
   From another device, visit: http://192.168.x.x:5174
   Try booking - should now show ✓ Inquiry Received!
   ```

2. **Check browser console** for debugging:
   - Open Developer Tools (F12)
   - Check Console tab for API URL being used
   - Check Network tab to see actual fetch requests

---

## Additional Backend Configuration Needed

The backend also has hardcoded localhost URLs that may need updating:

**In `backend/server.js` - Payment redirect URLs (line ~285-288):**

Currently:
```javascript
redirectUrl: 'http://localhost:5174/payment-success',
callbackUrl: 'http://localhost:3000/payment-callback',
```

Should be:
```javascript
redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/payment-success`,
callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:3000'}/payment-callback`,
```

Add to `backend/.env`:
```env
FRONTEND_URL=http://192.168.x.x:5174
BACKEND_URL=http://192.168.x.x:5003
```

---

## File Changes Summary

✅ Created: `src/config/api.ts` - Dynamic API URL configuration
✅ Updated: `src/pages/Contact.tsx` - Use dynamic URLs instead of hardcoded
✅ Created: `.env.local` - Local environment configuration
✅ Created: `.env.example` - Example configurations
✅ Updated: `.gitignore` - Ensure environment files aren't committed

---

## Why This Fix Works

1. **Auto-detection**: Uses `window.location.hostname` to detect the actual hostname being used
2. **Environment variables**: Allows overriding for production/deployment scenarios
3. **Fallback logic**: Works out of the box with sensible defaults
4. **Cross-device**: Same code now works from laptop, mobile, other devices on same network

---

## Next Steps

1. Test the fix from another device on your local network
2. Update backend URLs if needed (optional but recommended)
3. For production deployment, update `.env.local` with your server URL
4. Rebuild: `npm run build`

---

## Troubleshooting

**Still showing "Failed to fetch"?**

1. Check browser console (F12):
   - Look for the API URL being used
   - Should NOT be `localhost`

2. Ensure backend is running:
   - `cd backend`
   - `npm install` (if needed)
   - `npm start` or `node server.js`

3. Test API directly from other device:
   - Visit: `http://your-laptop-ip:5003/api/inquiries`
   - Should return JSON array

4. Check network connectivity:
   - Both devices should be on same WiFi
   - Firewall might be blocking port 5003
