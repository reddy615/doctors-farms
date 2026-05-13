const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

// FAQ Fallback System for when OpenAI is unavailable
const FAQ_DATABASE = {
  'check-in': {
    keywords: ['check in', 'check-in', 'arrival time', 'when can i', 'what time'],
    response: 'Check-in is available from 2:00 PM onwards. Early check-in may be available upon request (subject to availability). Please contact us for early check-in arrangements.',
  },
  'check-out': {
    keywords: ['check out', 'checkout', 'departure', 'when do i'],
    response: 'Check-out is at 11:00 AM. Late check-out may be available for an additional fee. Please contact our front desk for details.',
  },
  'room-price': {
    keywords: ['price', 'cost', 'how much', 'rate', 'charges'],
    response: 'Our Heritage Cottage is priced at ₹15,000 per night. This includes organic breakfast and access to all resort facilities. Prices may vary during peak seasons.',
  },
  'pool': {
    keywords: ['pool', 'swimming', 'water', 'swim'],
    response: 'Yes, we have a beautiful swimming pool available for all guests. Pool hours are 7 AM - 7 PM. Swimming pool access is included with your room booking.',
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
- Main Room: Heritage Cottage - ₹15,000/night
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
  // Build message array for OpenAI
  const messages = conversationHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
  messages.push({ role: 'user', content: userMessage });

  // Try OpenAI first
  let aiResponse = await callOpenAI(messages);

  // If OpenAI fails, use FAQ fallback
  if (!aiResponse) {
    console.log('Using FAQ fallback system');
    aiResponse = findFAQResponse(userMessage);
  }

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

  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
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
};
