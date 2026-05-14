const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const { handleChatMessage, validateBookingData, saveBookingInquiry } = require('../services/chatService');

dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

const router = express.Router();

const MAIL_PROVIDER = (process.env.MAIL_PROVIDER || 'custom').toLowerCase();
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'doctorsfarms686@gmail.com';
const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER || CONTACT_EMAIL;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

let transporter = null;
const usingResend = MAIL_PROVIDER === 'resend';
const resendClient = usingResend && RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

if (!usingResend && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

function formatBookingEmail(bookingData, inquiryId) {
  const guestCount = Number(bookingData.adults || 1) + Number(bookingData.children || 0);
  const stayText = bookingData.checkInDate && bookingData.checkOutDate
    ? `${bookingData.checkInDate} to ${bookingData.checkOutDate}`
    : bookingData.checkInDate || 'Not provided';

  return {
    subject: `New booking inquiry from ${bookingData.customerName}`,
    text: `New booking inquiry received\n\nInquiry ID: ${inquiryId}\nName: ${bookingData.customerName}\nEmail: ${bookingData.email}\nPhone: ${bookingData.phoneNumber}\nCheck-in: ${bookingData.checkInDate}\nCheck-out: ${bookingData.checkOutDate || 'Not provided'}\nGuests: ${guestCount} (${bookingData.adults} adult(s), ${bookingData.children} child(ren))\nRoom type: ${bookingData.roomType}\nStay: ${stayText}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
        <h2>New Booking Inquiry</h2>
        <p><strong>Inquiry ID:</strong> ${inquiryId}</p>
        <p><strong>Name:</strong> ${bookingData.customerName}</p>
        <p><strong>Email:</strong> ${bookingData.email}</p>
        <p><strong>Phone:</strong> ${bookingData.phoneNumber}</p>
        <p><strong>Check-in:</strong> ${bookingData.checkInDate}</p>
        <p><strong>Check-out:</strong> ${bookingData.checkOutDate || 'Not provided'}</p>
        <p><strong>Guests:</strong> ${guestCount} (${bookingData.adults} adult(s), ${bookingData.children} child(ren))</p>
        <p><strong>Room type:</strong> ${bookingData.roomType}</p>
        <p><strong>Stay:</strong> ${stayText}</p>
      </div>
    `,
  };
}

async function sendBookingEmail(bookingData, inquiryId) {
  const mail = formatBookingEmail(bookingData, inquiryId);

  if (usingResend && resendClient) {
    await resendClient.emails.send({
      from: MAIL_FROM,
      to: CONTACT_EMAIL,
      replyTo: bookingData.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });

    return;
  }

  if (transporter) {
    await transporter.sendMail({
      from: `"Doctors Farms Website" <${MAIL_FROM}>`,
      to: CONTACT_EMAIL,
      replyTo: bookingData.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
  }
}

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
    const { customerName, email, phoneNumber, checkInDate, checkOutDate, adults, children, roomType } = req.body;

    // Validate booking data
    const bookingData = {
      customerName,
      email,
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

    // mark inquiry as queued for email
    try {
      const fs = require('fs');
      const filePath = path.join(__dirname, '../inquiries.json');
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        const inquiries = JSON.parse(data || '[]');
        const idx = inquiries.findIndex((i) => i.id === inquiryId);
        if (idx !== -1) {
          inquiries[idx].emailStatus = 'queued';
          fs.writeFileSync(filePath, JSON.stringify(inquiries, null, 2));
        }
      }
    } catch (err) {
      console.error('Failed to mark inquiry queued:', err);
    }

    // Respond immediately to avoid client-side timeout; send emails in background
    res.json({
      success: true,
      inquiryId,
      message: 'Booking inquiry submitted successfully (email queued)',
    });

    // Background email send with retries and timeout
    (async function sendBookingEmailBackground() {
      // helper: retry wrapper with per-attempt timeout
      const sendWithRetry = async (fn, attempts = 3, timeoutMs = 20000, delays = [2000, 5000]) => {
        for (let attempt = 1; attempt <= attempts; attempt++) {
          try {
            const result = await Promise.race([
              fn(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('send_timeout')), timeoutMs)),
            ]);
            return result;
          } catch (err) {
            const isLast = attempt === attempts;
            console.error(`Booking email attempt ${attempt} failed:`, err instanceof Error ? err.message : String(err));
            if (isLast) throw err;
            const delay = delays[Math.min(attempt - 1, delays.length - 1)];
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      };

      let emailSendFailed = false;
      try {
        if (usingResend && resendClient) {
          await sendWithRetry(() => resendClient.emails.send({ from: MAIL_FROM, to: CONTACT_EMAIL, replyTo: bookingData.email, subject: formatBookingEmail(bookingData, inquiryId).subject, text: formatBookingEmail(bookingData, inquiryId).text, html: formatBookingEmail(bookingData, inquiryId).html }));
        } else if (transporter) {
          await sendWithRetry(() => transporter.sendMail({ from: `"Doctors Farms Website" <${MAIL_FROM}>`, to: CONTACT_EMAIL, replyTo: bookingData.email, subject: formatBookingEmail(bookingData, inquiryId).subject, text: formatBookingEmail(bookingData, inquiryId).text, html: formatBookingEmail(bookingData, inquiryId).html }));
        } else {
          throw new Error('Mail transporter not configured');
        }
      } catch (err) {
        emailSendFailed = true;
        console.error('Booking background email error:', err);
      }

      // update inquiry status
      try {
        const fs = require('fs');
        const filePath = path.join(__dirname, '../inquiries.json');
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, 'utf-8');
          const inquiries = JSON.parse(data || '[]');
          const idx = inquiries.findIndex((i) => i.id === inquiryId);
          if (idx !== -1) {
            inquiries[idx].emailStatus = emailSendFailed ? 'delayed' : 'sent';
            fs.writeFileSync(filePath, JSON.stringify(inquiries, null, 2));
          }
        }
      } catch (err) {
        console.error('Failed to update inquiry status after email send:', err);
      }
    })();

    // Calculate stay duration
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate || checkInDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)) || 1;
    const PRICE_PER_NIGHT = 15000;
    const totalPrice = nights * PRICE_PER_NIGHT;
    res.json({
      success: true,
      inquiryId,
      bookingSummary: {
        customerName,
        email,
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
