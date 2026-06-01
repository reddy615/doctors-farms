const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

// FAQ Fallback System for when OpenAI is unavailable
const FAQ_DATABASE = {
  'heritage-cottage': {
    keywords: ['heritage cottage', 'room price', 'room rates', 'how much is the room', 'price per night'],
    response: 'Our Heritage Cottage is priced at ₹15,000 for 24 Hours. This includes organic breakfast and access to all resort facilities. Prices may vary during peak seasons.',
  },
  'check-in': {
    keywords: ['check in', 'check-in', 'arrival time', 'when can i', 'what time'],
    response: 'Check-in is available from 2:00 PM onwards. Early check-in may be available upon request (subject to availability). Please contact us for early check-in arrangements.',
  },
  'check-out': {
    keywords: ['check out', 'checkout', 'departure', 'when do i'],
    response: 'Check-out is at 11:00 AM. Late check-out may be available for an additional fee. Please contact our front desk for details.',
  },
  'booking': {
    keywords: ['book', 'booking', 'reserve', 'reservation', 'how do i book'],
    response: 'You can book by using the chatbot booking form or by contacting our team directly. If you already know your stay dates, send them in chat and we can guide you from there.',
  },
  'pool': {
    keywords: ['pool', 'swimming', 'water', 'swim'],
    response: 'Yes, we have a beautiful swimming pool available for all guests. Pool hours are 7 AM - 7 PM. Swimming pool access is included with your room booking.',
  },
  'dining': {
    keywords: ['dining', 'food', 'meals', 'breakfast', 'lunch', 'dinner', 'restaurant'],
    response: 'We offer farm-to-table dining with fresh, locally sourced meals. Breakfast is included with the Heritage Cottage, and our team can help with dietary preferences too.',
  },
  'facilities': {
    keywords: ['facilities', 'amenities', 'what do you have', 'what\'s included'],
    response: 'Our resort offers: Swimming pool, Yoga studio, Meditation areas, Farm-to-table dining, WiFi, AC rooms, Hot water, Private terrace, and organized activities on the farm.',
  },
  'activities': {
    keywords: ['activities', 'things to do', 'entertainment', 'what can i do'],
    response: 'Enjoy farm activities, yoga sessions, meditation, nature walks, bird watching, organic farm tours, and cultural experiences. Our team can arrange customized activities based on your interests.',
  },
  'contact': {
    keywords: ['contact', 'support', 'help', 'call', 'phone', 'email', 'reach'],
    response: 'Contact us:\n📞 +91-9955575969\n📧 doctorsfarms686@gmail.com\nOr use the booking form to schedule a callback from our team.',
  },
  'wifi': {
    keywords: ['wifi', 'wi-fi', 'internet', 'network'],
    response: 'Yes, WiFi is available for guests during their stay.',
  },
  'family': {
    keywords: ['family', 'children', 'kids', 'family group', 'how many'],
    response: 'We welcome families! Our cottages can accommodate up to 6 people comfortably. We have activities and facilities suitable for children. Please let us know the age of children for personalized recommendations.',
  },
  'dietary': {
    keywords: ['diet', 'vegetarian', 'vegan', 'dietary', 'allergy', 'food'],
    response: 'We accommodate all dietary preferences and allergies. Our farm-to-table menu can be customized. Please inform us about your dietary requirements at the time of booking.',
  },
};

/**
 * Find matching FAQ response based on keywords
 */
function findFAQResponse(message) {
  const lowerMessage = message.toLowerCase();

  for (const [key, faq] of Object.entries(FAQ_DATABASE)) {
    if (faq.keywords.some((keyword) => lowerMessage.includes(keyword))) {
      return faq.response;
    }
  }

  return null;
}

function isGreetingMessage(message) {
  const normalized = message
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const greetingWords = new Set([
    'hi',
    'hello',
    'hey',
    'hii',
    'hiii',
    'hola',
    'good morning',
    'good afternoon',
    'good evening',
  ]);

  return greetingWords.has(normalized);
}

function isHowAreYouMessage(message) {
  const normalized = message
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const variants = new Set([
    'how are you',
    'how are you doing',
    'how are you today',
    'how r u',
    'how ru',
    'how you doing',
  ]);

  return variants.has(normalized);
}

function hasDateOrTimeDetails(message) {
  const lowerMessage = message.toLowerCase();

  const datePattern = /(\b\d{1,2}[\/-]\d{1,2}([\/-]\d{2,4})?\b)|(\b\d{4}-\d{2}-\d{2}\b)/;
  const timePattern = /(\b\d{1,2}(:\d{2})?\s?(am|pm)\b)|(\b\d{1,2}:\d{2}\b)/;
  const weekdayPattern = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|next week|weekend)\b/;
  const monthPattern = /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/;

  return datePattern.test(lowerMessage)
    || timePattern.test(lowerMessage)
    || weekdayPattern.test(lowerMessage)
    || monthPattern.test(lowerMessage);
}

function isBookingIntentMessage(message) {
  const lowerMessage = message.toLowerCase();

  // Only treat explicit booking verbs or check-in/check-out phrases as booking intent.
  const bookingIntentPattern = /\b(book|booking|reserve|reservation|check in|check-in|check out|check-out|want to book|i want to book)\b/;

  return bookingIntentPattern.test(lowerMessage) || hasDateOrTimeDetails(lowerMessage);
}

function isExactBookRoomRequest(message) {
  const normalized = message.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized === 'i want to book room';
}

function buildBookingChoices() {
  return {
    reply: 'We’re delighted to assist you with your reservation 😊\nPlease choose your preferred booking experience below\n👉 Book Manually\n👉 Let Me Assist You',
    options: [
      { label: 'Book Manually', value: 'book-manually' },
      { label: 'Let Me Assist You', value: 'let-me-assist-you' },
    ],
    actionType: 'booking-choices',
  };
}

/**
 * Call OpenAI API
 */
async function callOpenAI(messages) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('OpenAI API key not configured. Using FAQ fallback.');
    return null;
  }

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an intelligent virtual assistant for Doctors Farms Resort. Help users with room bookings, resort information, pricing, activities, facilities, and customer support in a professional and friendly manner. 
          
Resort Information:
- Name: Doctors Farms Resort
- Type: Eco-friendly luxury resort with farm-stay experience
- Main Room: Heritage Cottage - ₹15,000 for 24 Hours
- Facilities: Swimming pool, yoga studio, meditation area, farm tours, organic dining
- Check-in: 2 PM, Check-out: 11 AM
- Activities: Yoga, meditation, farm activities, nature walks
- Perfect for: Wellness retreats, family getaways, corporate events

Always be helpful, professional, and encourage bookings. If unsure, suggest contacting support.`,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Main chat handler
 */
async function handleChatMessage(userMessage, conversationHistory = [], messageType = 'general') {
  if (isHowAreYouMessage(userMessage)) {
    return 'I\'m doing wonderful, thank you for asking 😊\nIt\'s a pleasure assisting you today.';
  }

  if (isGreetingMessage(userMessage)) {
    return 'Hello 😊\nHope you\'re having a wonderful day!\nHow may I assist you?';
  }

  if (isExactBookRoomRequest(userMessage)) {
    return buildBookingChoices();
  }

  if (isBookingIntentMessage(userMessage)) {
    return buildBookingChoices();
  }

  const faqResponse = findFAQResponse(userMessage);

  if (faqResponse) {
    return faqResponse;
  }

  // Build message array for OpenAI
  const messages = conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
  messages.push({ role: 'user', content: userMessage });

  // Try OpenAI first
  let aiResponse = await callOpenAI(messages);

  // If still no response, provide default
  if (!aiResponse) {
    aiResponse =
      'Thank you for your question! I could not find a specific answer, but our team would be happy to help. Please use the booking form or contact us directly for personalized assistance.';
  }

  return aiResponse;
}

/**
 * Validate booking data
 */
function validateBookingData(data) {
  const errors = [];
  const phoneDigits = String(data.phoneNumber || '').replace(/\D/g, '');

  if (!data.customerName || data.customerName.trim().length < 2) {
    errors.push('Customer name is required');
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email address is required');
  }

  if (!phoneDigits || !(phoneDigits.length === 10 || (phoneDigits.length === 12 && phoneDigits.startsWith('91')))) {
    errors.push('Valid phone number is required');
  }

  if (!data.checkInDate) {
    errors.push('Check-in date is required');
  }

  if (data.adults < 1) {
    errors.push('At least 1 adult is required');
  }

  return errors;
}

/**
 * Save booking inquiry to JSON file (for Node.js backend)
 */
function saveBookingInquiry(bookingData) {
  const fs = require('fs');
  const filePath = path.join(__dirname, '../inquiries.json');
  const normalizedPhone = String(bookingData.phoneNumber || '').replace(/\s+/g, ' ').trim();

  let inquiries = [];

  // Read existing inquiries
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      inquiries = JSON.parse(data);
    } catch (err) {
      console.error('Error reading inquiries:', err);
    }
  }

  // Create new inquiry
  const totalGuests = Number(bookingData.adults || 0) + Number(bookingData.children || 0);
  const newInquiry = {
    id: `INQ_${Date.now()}`,
    name: bookingData.customerName,
    email: bookingData.email,
    phone: normalizedPhone,
    stay: bookingData.checkInDate && bookingData.checkOutDate
      ? `${bookingData.checkInDate} to ${bookingData.checkOutDate}`
      : bookingData.checkInDate || 'Not provided',
    checkIn: bookingData.checkInDate || '',
    checkOut: bookingData.checkOutDate || '',
    roomType: bookingData.roomType || 'Heritage Cottage',
    adults: Number(bookingData.adults || 1),
    children: Number(bookingData.children || 0),
    guests: totalGuests || Number(bookingData.adults || 1),
    message: bookingData.message || `Booking inquiry from chatbot for ${bookingData.customerName}`,
    bookingStatus: 'received',
    paymentStatus: 'pending',
    bookingEvents: [],
    ...bookingData,
    phoneNumber: normalizedPhone,
    createdAt: new Date().toISOString(),
  };

  inquiries.push(newInquiry);

  // Write back to file
  try {
    fs.writeFileSync(filePath, JSON.stringify(inquiries, null, 2));
    return newInquiry.id;
  } catch (err) {
    console.error('Error saving inquiry:', err);
    throw new Error('Failed to save booking inquiry');
  }
}

module.exports = {
  handleChatMessage,
  validateBookingData,
  saveBookingInquiry,
  findFAQResponse,
  isHowAreYouMessage,
  isGreetingMessage,
  isBookingIntentMessage,
};
