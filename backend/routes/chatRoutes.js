const express = require('express');
const { handleChatMessage, validateBookingData, saveBookingInquiry } = require('../services/chatService');

const router = express.Router();

/**
 * POST /api/chat
 * Handle chat messages
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [], messageType = 'general' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const reply = await handleChatMessage(message, conversationHistory, messageType);

    res.json({
      success: true,
      reply,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      message: error.message,
    });
  }
});

/**
 * POST /api/booking-inquiry
 * Handle booking inquiries from chatbot
 */
router.post('/booking-inquiry', async (req, res) => {
  try {
    const { customerName, phoneNumber, checkInDate, checkOutDate, adults, children, roomType } = req.body;

    // Validate booking data
    const bookingData = {
      customerName,
      phoneNumber,
      checkInDate,
      checkOutDate,
      adults,
      children,
      roomType,
    };

    const errors = validateBookingData(bookingData);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    // Save booking inquiry
    const inquiryId = saveBookingInquiry(bookingData);

    // Calculate stay duration
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate || checkInDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)) || 1;
    const PRICE_PER_NIGHT = 15000;
    const totalPrice = nights * PRICE_PER_NIGHT;

    res.json({
      success: true,
      inquiryId,
      message: 'Booking inquiry submitted successfully',
      bookingSummary: {
        customerName,
        checkInDate,
        checkOutDate: checkOutDate || checkInDate,
        guests: `${adults} adult(s), ${children} child(ren)`,
        nights,
        totalPrice: `₹${totalPrice.toLocaleString('en-IN')}`,
      },
    });
  } catch (error) {
    console.error('Booking inquiry error:', error);
    res.status(500).json({
      error: 'Failed to process booking inquiry',
      message: error.message,
    });
  }
});

/**
 * GET /api/chat/faq
 * Get FAQ database (for debugging)
 */
router.get('/faq', (req, res) => {
  res.json({
    message: 'FAQ endpoints',
    availableQuestions: [
      'Check-in/checkout times',
      'Room prices',
      'Facilities',
      'Activities',
      'Pool access',
      'Dietary preferences',
      'Family accommodations',
      'Contact information',
    ],
  });
});

module.exports = router;
