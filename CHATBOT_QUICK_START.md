# 🤖 AI Chatbot - Quick Start Guide

## ✨ What's New

Your Doctors Farms Resort website now has a **production-ready AI-powered chatbot** that:

✅ **Appears as a floating button** at bottom-right of website
✅ **Answers guest questions** about rooms, facilities, activities
✅ **Processes bookings** with a guided form
✅ **Works without internet** using FAQ fallback system
✅ **Mobile responsive** and smooth animations
✅ **Saves bookings** to database for your team

---

## 🚀 Getting Started (5 minutes)

### 1. **No Configuration Needed!**
The chatbot works **out-of-the-box** without any setup. Just run:

```bash
npm run dev
```

Then visit: http://localhost:5173

You'll see a green chat button at the bottom-right corner.

### 2. **Optional: Add AI Responses**
To enable AI-powered responses (currently uses FAQ):

**Step 1:** Get OpenAI API key
- Visit https://platform.openai.com/api-keys
- Create new key
- Copy the key

**Step 2:** Update backend/.env
```bash
OPENAI_API_KEY=sk-your-key-here
```

**Step 3:** Restart backend
```bash
npm --prefix backend run dev
```

The chatbot will now use AI for more natural responses!

---

## 💬 Chat Features

### What Users Can Do:

1. **Click the green button** at bottom-right
2. **Choose quick actions:**
   - 📘 Book Room
   - 💰 Room Prices
   - 🏢 Facilities
   - 🎯 Activities
   - 📞 Contact Support

3. **Type any question:**
   - "What's your WiFi speed?"
   - "Can I bring my dog?"
   - "Do you offer airport pickup?"
   - "How far is the nearest hospital?"

4. **Fill booking form:**
   - Name, phone, dates
   - Number of guests
   - Get instant booking ID

---

## 📁 Files Added

### Frontend (React Components)
```
src/components/ChatBot/
├── ChatBotWidget.tsx      ← Main chatbot
├── MessageBubble.tsx      ← Message display
├── TypingIndicator.tsx    ← Loading animation
├── QuickActions.tsx       ← Action buttons
├── BookingForm.tsx        ← Booking form
├── ChatBot.css            ← Styling
└── index.ts               ← Exports
```

### Backend (Express Services)
```
backend/
├── routes/chatRoutes.js      ← API endpoints
├── services/chatService.js   ← Chat logic & FAQ
└── .env                      ← Configuration
```

### Documentation
```
CHATBOT_SETUP_GUIDE.md        ← Comprehensive guide
CHATBOT_ENV_SETUP.md          ← Environment variables
```

---

## 🔧 Customization

### Change Chatbot Color/Style
Edit `src/components/ChatBot/ChatBot.css`:

```css
/* Change these to match your brand */
background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
```

### Update Welcome Message
Edit `src/components/ChatBot/ChatBotWidget.tsx`:

```typescript
{
  id: '1',
  text: 'Your custom welcome message here',
  sender: 'bot',
  timestamp: new Date(),
}
```

### Add More Quick Actions
Edit `src/components/ChatBot/QuickActions.tsx`:

```typescript
const actions = [
  { label: 'Your Custom Action', icon: IconName },
  // ...
];
```

### Update FAQ Responses
Edit `backend/services/chatService.js`:

```javascript
const FAQ_DATABASE = {
  'your-keyword': {
    keywords: ['keyword1', 'keyword2'],
    response: 'Your response here',
  },
};
```

---

## 📊 Viewing Bookings

Bookings are saved in `backend/inquiries.json`:

```bash
# View all bookings
curl http://localhost:5000/api/inquiries

# View specific booking
curl http://localhost:5000/api/inquiries/INQ_1715589000000
```

Each booking contains:
- Customer name & phone
- Check-in/checkout dates
- Number of guests
- Room type
- Timestamp

---

## 🌐 Deployment

The chatbot is **fully integrated** for Railway deployment:

1. **Frontend chatbot** loads with the app
2. **Backend API** handles requests
3. **FAQ system** works without internet
4. **Production URLs** already configured in CORS

Just deploy as usual:
```bash
npm run build
git push
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Chatbot not visible | Clear cache (Ctrl+Shift+Delete) or check browser console |
| Messages not sending | Ensure backend is running (`npm --prefix backend run dev`) |
| Booking not saved | Check `backend/inquiries.json` file permissions |
| Slow responses | Add `OPENAI_API_KEY` for AI mode, or wait (FAQ is instant) |
| Styling looks off | Ensure Tailwind CSS is loaded in your HTML |

---

## 📞 API Reference

### Send Message
```bash
POST /api/chat
{
  "message": "What are your prices?",
  "conversationHistory": [],
  "messageType": "general"
}
```

### Submit Booking
```bash
POST /api/booking-inquiry
{
  "customerName": "John Doe",
  "phoneNumber": "9876543210",
  "checkInDate": "2024-06-01",
  "checkOutDate": "2024-06-03",
  "adults": 2,
  "children": 0,
  "roomType": "Heritage Cottage"
}
```

### Check FAQ
```bash
GET /api/faq
```

---

## 🎯 Next Steps

### Immediate
1. ✅ Chatbot is live and working
2. ✅ FAQ system is operational
3. ✅ Bookings are being saved

### Recommended
1. **Add OpenAI key** for AI responses (see Getting Started)
2. **Configure email** to get booking notifications
3. **Monitor bookings** in `backend/inquiries.json`
4. **Test on mobile** to see responsive design

### Advanced
1. Connect to database (MongoDB/PostgreSQL)
2. Send email confirmations
3. Add admin dashboard to manage bookings
4. Multi-language support
5. WhatsApp integration

---

## 📚 Full Documentation

For complete details, see:
- `CHATBOT_SETUP_GUIDE.md` - Comprehensive guide
- `CHATBOT_ENV_SETUP.md` - Environment variables
- Inline code comments in components

---

## 🎉 You're All Set!

Your resort now has an intelligent chatbot that:
- ✅ Appears automatically on the website
- ✅ Helps guests book rooms
- ✅ Answers common questions
- ✅ Saves inquiries for your team
- ✅ Works offline with FAQ system
- ✅ Looks modern and professional

**Happy chatting!** 🚀

---

**Questions?** Check the troubleshooting section or review the setup guide.
