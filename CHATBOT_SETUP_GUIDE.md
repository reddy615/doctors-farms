# AI Chatbot Integration Guide - Doctors Farms Resort

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Configuration](#configuration)
5. [Features](#features)
6. [API Endpoints](#api-endpoints)
7. [File Structure](#file-structure)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## 📱 Project Overview

This is a production-ready AI chatbot system integrated into the Doctors Farms Resort website. It helps users book rooms, ask questions about facilities, and get instant support.

### Key Features
✅ **Floating Chat Widget** - Always accessible, minimizable UI
✅ **AI-Powered Responses** - Uses OpenAI API (with FAQ fallback)
✅ **Smart Booking Form** - Guided booking inquiry workflow
✅ **Session Memory** - Maintains conversation context
✅ **Mobile Responsive** - Works seamlessly on all devices
✅ **FAQ Fallback System** - Works without OpenAI if needed
✅ **Rate Limited** - Protected against spam
✅ **Production Ready** - Error handling, validation, security

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 19 + TypeScript
- Vite (Build tool)
- Axios (HTTP client)
- Lucide React (Icons)
- Tailwind CSS (Styling)

**Backend:**
- Express.js (Node.js)
- OpenAI API (AI responses)
- Nodemailer (Email notifications)
- Resend (Email service)
- PhonePe (Payment integration)

**Data Storage:**
- JSON file-based storage (inquiries.json)
- Can be extended to MongoDB/PostgreSQL

### Component Flow

```
User → ChatBotWidget → Axios → Express Backend → OpenAI API
                                    ↓
                              FAQ Database (fallback)
                                    ↓
                              Response → Frontend
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 20.19.0 or higher
- npm or yarn
- OpenAI API key (optional, FAQ works without it)
- Git

### Step 1: Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
npm --prefix backend install
```

### Step 2: Update Frontend Dependencies

The package.json has been updated to include:
- `lucide-react` - For icons
- `axios` - For HTTP requests (already present)

If you need to update manually:
```bash
npm install lucide-react axios
```

### Step 3: Backend Routes Registration

The chat routes have been automatically added to `backend/server.js`:
```javascript
const chatRoutes = require('./routes/chatRoutes');
app.use('/api', chatRoutes);
```

### Step 4: Frontend Integration

The chatbot has been integrated into `src/App.tsx`:
```typescript
import { ChatBotWidget } from "./components/ChatBot";

// In your App component:
<ChatBotWidget />
```

---

## 🔧 Configuration

### 1. Environment Variables

Create/update `.env` file in the backend directory:

```bash
# Core
NODE_ENV=development
PORT=5000
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# AI (Optional - works without this)
OPENAI_API_KEY=sk-...your-key-here...

# Email Service
MAIL_PROVIDER=resend
RESEND_API_KEY=re_...your-key-here...

# Or use Gmail/Brevo/Custom SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Frontend Environment

Create `.env` file in the root directory:
```bash
VITE_BACKEND_URL=http://localhost:5000
```

### 3. Get API Keys

**OpenAI API:**
1. Visit https://platform.openai.com/api-keys
2. Create new API key
3. Add to `.env` as `OPENAI_API_KEY`

**Resend Email Service:**
1. Visit https://resend.com
2. Sign up and verify domain
3. Get API key from dashboard
4. Add to `.env` as `RESEND_API_KEY`

---

## 📚 Features

### 1. **Floating Chat Widget**
- Fixed position at bottom-right
- Smooth animations
- Minimize/maximize functionality
- Auto-close option
- Pulsing notification animation

### 2. **Chat Interface**
- Scrollable message area
- Typing indicator for bot responses
- Timestamps on messages
- User and bot message differentiation
- Loading states
- Error handling

### 3. **Quick Actions**
Users can click:
- 📘 Book Room
- 💰 Room Prices
- 🏢 Facilities
- 🎯 Activities
- 📞 Contact Support

### 4. **Smart Booking Form**
Collects:
- Customer name
- Phone number (10-digit validation)
- Check-in date (with date picker)
- Check-out date (optional)
- Number of adults (1-6)
- Number of children (0-4)
- Room type selection

**On submission:**
- Validates all fields
- Calculates stay duration
- Estimates total price
- Saves to database
- Shows confirmation with booking ID

### 5. **AI-Powered Responses**
The chatbot can answer:
- "Do you have rooms available?"
- "What are your prices?"
- "Is there a swimming pool?"
- "What activities are available?"
- "Can I book for 8 people?"
- And many more...

### 6. **FAQ Fallback System**
If OpenAI is unavailable, the bot uses keyword-based FAQ responses for:
- Check-in/check-out times
- Pricing information
- Facilities
- Activities
- Dietary preferences
- Family accommodations
- Contact information

---

## 🔌 API Endpoints

### Chat Endpoint

**POST** `/api/chat`
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are your room prices?",
    "conversationHistory": [],
    "messageType": "general"
  }'
```

**Response:**
```json
{
  "success": true,
  "reply": "Our Heritage Cottage is priced at ₹15,000 per night...",
  "timestamp": "2024-05-13T10:30:00Z"
}
```

### Booking Inquiry Endpoint

**POST** `/api/booking-inquiry`
```bash
curl -X POST http://localhost:5000/api/booking-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "phoneNumber": "9876543210",
    "checkInDate": "2024-06-01",
    "checkOutDate": "2024-06-03",
    "adults": 2,
    "children": 1,
    "roomType": "Heritage Cottage"
  }'
```

**Response:**
```json
{
  "success": true,
  "inquiryId": "INQ_1715589000000",
  "message": "Booking inquiry submitted successfully",
  "bookingSummary": {
    "customerName": "John Doe",
    "checkInDate": "2024-06-01",
    "checkOutDate": "2024-06-03",
    "guests": "2 adult(s), 1 child(ren)",
    "nights": 2,
    "totalPrice": "₹30,000"
  }
}
```

### FAQ Endpoint

**GET** `/api/faq`
```bash
curl http://localhost:5000/api/faq
```

---

## 📁 File Structure

```
docs-farms/
├── backend/
│   ├── routes/
│   │   └── chatRoutes.js          # Chat API routes
│   ├── services/
│   │   └── chatService.js          # Chat logic & FAQ
│   ├── server.js                   # Updated with chat routes
│   └── .env                        # Environment variables
│
├── src/
│   ├── components/
│   │   ├── ChatBot/
│   │   │   ├── ChatBotWidget.tsx   # Main widget component
│   │   │   ├── MessageBubble.tsx   # Message display
│   │   │   ├── TypingIndicator.tsx # Loading state
│   │   │   ├── QuickActions.tsx    # Action buttons
│   │   │   ├── BookingForm.tsx     # Booking form
│   │   │   ├── ChatBot.css         # Styling
│   │   │   └── index.ts            # Component exports
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── ...other components
│   ├── App.tsx                     # Updated with ChatBot import
│   ├── main.tsx
│   └── ...other files
│
├── .env                            # Frontend config
├── package.json                    # Updated with lucide-react
├── vite.config.ts
├── tsconfig.json
└── CHATBOT_ENV_SETUP.md           # Environment guide
```

---

## 🚀 Deployment

### Local Development

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (already running with npm run dev)
# Backend runs on http://localhost:5000
# Frontend runs on http://localhost:5173
```

### Production Deployment (Railway)

#### 1. Environment Variables in Railway

Add these to your Railway project settings:
```
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
MAIL_PROVIDER=resend
NODE_ENV=production
```

#### 2. Build Command
```bash
npm run build
```

#### 3. Start Command
```bash
npm --prefix backend run start
```

#### 4. Update CORS Origins

The backend already includes production URLs:
```javascript
allowedOrigins: [
  'https://doctors-farms-production.up.railway.app',
  'https://www.doctorsfarms.in',
  'https://doctorsfarms.in',
  ...
]
```

#### 5. Update Frontend .env

Set in your Railway environment:
```
VITE_BACKEND_URL=https://api.doctorsfarms.in
```

---

## 🐛 Troubleshooting

### Issue: Chatbot doesn't appear

**Solution:**
1. Check browser console for errors (F12)
2. Ensure `ChatBotWidget` is imported in App.tsx
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check if component files exist in `src/components/ChatBot/`

### Issue: Chat not sending messages

**Solution:**
1. Check backend is running (`npm --prefix backend run dev`)
2. Verify backend URL in `.env` file
3. Check CORS errors in browser console
4. Ensure Express routes are registered in `server.js`

### Issue: Slow responses

**Solution:**
1. If using OpenAI, check API quota
2. Look for timeout issues in backend logs
3. The FAQ fallback should be instant if OpenAI is slow
4. Check network tab in DevTools

### Issue: Booking form not saving

**Solution:**
1. Verify `inquiries.json` exists in `backend/` directory
2. Check backend write permissions
3. Look for validation errors in console
4. Ensure phone number is 10 digits

### Issue: "API key not configured" message

**Solution:**
1. This is normal! The FAQ system works without OpenAI
2. To enable AI, add `OPENAI_API_KEY` to `.env`
3. The chatbot will still work with FAQ responses
4. Check backend logs for details

---

## 📞 Support Features

The chatbot supports:
- **Instant FAQ responses** - For common questions
- **AI-powered answers** - Using OpenAI (if configured)
- **Booking workflow** - Step-by-step guided booking
- **Contact info** - Direct support contact
- **Error handling** - Graceful fallbacks

---

## 🔐 Security Notes

✅ **Never expose API keys** in frontend code
✅ All API calls go through backend
✅ Rate limiting on inquiry endpoints
✅ Input validation on all forms
✅ CORS properly configured
✅ No sensitive data in browser storage

---

## 📈 Next Steps

Consider implementing:
1. **Database Integration** - MongoDB/PostgreSQL for persistent storage
2. **Email Notifications** - Send booking confirmation emails
3. **Admin Dashboard** - View and manage bookings
4. **Analytics** - Track chatbot usage and conversion
5. **Multi-language** - Support multiple languages
6. **Voice Chat** - Add audio capabilities
7. **WhatsApp Integration** - Direct WhatsApp booking

---

## 📄 License & Support

For issues or questions:
- Check the troubleshooting section
- Review backend logs
- Check browser console for errors
- Review API responses in Network tab

Happy chatting! 🚀
