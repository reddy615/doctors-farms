const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const { handleChatMessage, validateBookingData, saveBookingInquiry } = require('../services/chatService');
const { sendAdminNotification } = require('../services/emailService');
const { sendBookingConfirmationEmail } = require('../services/emailConfirmationService');
const { hasBlockedDateConflict } = require('../services/blockedDatesService');

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
    text: `New booking inquiry received\n\nInquiry ID: ${inquiryId}\nName: ${bookingData.customerName}\nEmail: ${bookingData.email}\nPhone: ${bookingData.phoneNumber}\nCheck-in: ${bookingData.checkInDate} ${bookingData.checkInTime || ''}\nCheck-out: ${bookingData.checkOutDate || 'Not provided'} ${bookingData.checkOutTime || ''}\nGuests: ${guestCount} (${bookingData.adults} adult(s), ${bookingData.children} child(ren))\nRoom type: ${bookingData.roomType}\nTotal Price: ₹${(bookingData.totalPrice || 0).toLocaleString('en-IN')}\nStay: ${stayText}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
        <h2>New Booking Inquiry</h2>
        <p><strong>Inquiry ID:</strong> ${inquiryId}</p>
        <p><strong>Name:</strong> ${bookingData.customerName}</p>
        <p><strong>Email:</strong> ${bookingData.email}</p>
        <p><strong>Phone:</strong> ${bookingData.phoneNumber}</p>
        <p><strong>Check-in:</strong> ${bookingData.checkInDate} ${bookingData.checkInTime || ''}</p>
        <p><strong>Check-out:</strong> ${bookingData.checkOutDate || 'Not provided'} ${bookingData.checkOutTime || ''}</p>
        <p><strong>Guests:</strong> ${guestCount} (${bookingData.adults} adult(s), ${bookingData.children} child(ren))</p>
        <p><strong>Room type:</strong> ${bookingData.roomType}</p>
        <p><strong>Total Price:</strong> ₹${(bookingData.totalPrice || 0).toLocaleString('en-IN')}</p>
        <p><strong>Stay:</strong> ${stayText}</p>
      </div>
    `,
  };
}

function formatGuestConfirmationEmail(bookingData, inquiryId) {
  const guestCount = Number(bookingData.adults || 1) + Number(bookingData.children || 0);
  const stayText = bookingData.checkInDate && bookingData.checkOutDate
    ? `${bookingData.checkInDate} to ${bookingData.checkOutDate}`
    : bookingData.checkInDate || 'Not provided';

  return {
    subject: `Your booking inquiry ${inquiryId} has been received`,
    text: `Hi ${bookingData.customerName},

Thanks for contacting Doctors Farms Resort. We received your booking inquiry and our team will contact you shortly.

Inquiry ID: ${inquiryId}
Room type: ${bookingData.roomType || 'Heritage Cottage'}
Check-in: ${bookingData.checkInDate || 'Not provided'} ${bookingData.checkInTime || ''}
Check-out: ${bookingData.checkOutDate || 'Not provided'} ${bookingData.checkOutTime || ''}
Guests: ${guestCount} (${bookingData.adults || 1} adult(s), ${bookingData.children || 0} child(ren))
Total Price: ₹${(bookingData.totalPrice || 0).toLocaleString('en-IN')}
Stay: ${stayText}

Regards,
Doctors Farms Team`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
        <h2>Booking Inquiry Received</h2>
        <p>Hi ${bookingData.customerName},</p>
        <p>Thanks for contacting Doctors Farms Resort. We received your booking inquiry and our team will contact you shortly.</p>
        <p><strong>Inquiry ID:</strong> ${inquiryId}</p>
        <p><strong>Room type:</strong> ${bookingData.roomType || 'Heritage Cottage'}</p>
        <p><strong>Check-in:</strong> ${bookingData.checkInDate || 'Not provided'} ${bookingData.checkInTime || ''}</p>
        <p><strong>Check-out:</strong> ${bookingData.checkOutDate || 'Not provided'} ${bookingData.checkOutTime || ''}</p>
        <p><strong>Guests:</strong> ${guestCount} (${bookingData.adults || 1} adult(s), ${bookingData.children || 0} child(ren))</p>
        <p><strong>Total Price:</strong> ₹${(bookingData.totalPrice || 0).toLocaleString('en-IN')}</p>
        <p><strong>Stay:</strong> ${stayText}</p>
        <p>Regards,<br>Doctors Farms Team</p>
      </div>
    `,
  };
}

function normalizeChatReply(reply) {
  if (typeof reply === 'string') {
    return { reply };
  }

  if (reply && typeof reply === 'object') {
    return {
      reply: reply.reply || '',
      options: Array.isArray(reply.options) ? reply.options : undefined,
      actionType: reply.actionType || undefined,
    };
  }

  return { reply: '' };
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
    const normalizedReply = normalizeChatReply(reply);

    res.json({
      success: true,
      ...normalizedReply,
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
    const { customerName, email, phoneNumber, checkInDate, checkInTime, checkOutDate, checkOutTime, adults, children, roomType, totalPrice } = req.body;

    // Validate booking data
    const bookingData = {
      customerName,
      email,
      phoneNumber,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      adults,
      children,
      roomType,
      totalPrice: totalPrice || 0,
    };

    const errors = validateBookingData(bookingData);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    if (hasBlockedDateConflict(checkInDate, checkOutDate)) {
      return res.status(400).json({
        error: 'Selected date is blocked',
        details: ['One or more selected dates are blocked by the admin.'],
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
          inquiries[idx].userConfirmationEmailStatus = 'queued';
          fs.writeFileSync(filePath, JSON.stringify(inquiries, null, 2));
        }
      }
    } catch (err) {
      console.error('Failed to mark inquiry queued:', err);
    }

    const mailConfig = {
      usingResend,
      resendClient,
      transporter,
      mailFrom: MAIL_FROM,
      contactEmail: CONTACT_EMAIL,
    };

    const adminMail = formatBookingEmail(bookingData, inquiryId);

    const [adminResult, userResult] = await Promise.allSettled([
      sendAdminNotification({ mail: {
        from: `"Doctors Farms Website" <${MAIL_FROM}>`,
        to: CONTACT_EMAIL,
        replyTo: bookingData.email,
        subject: adminMail.subject,
        text: adminMail.text,
        html: adminMail.html,
      }, mailConfig }),
      sendBookingConfirmationEmail({
        bookingData: {
          customerName: bookingData.customerName,
          email: bookingData.email,
          phoneNumber: bookingData.phoneNumber,
          roomType: bookingData.roomType || 'Heritage Cottage',
          checkInDate: bookingData.checkInDate || '',
          checkOutDate: bookingData.checkOutDate || '',
          adults: Number(bookingData.adults || 1),
          children: Number(bookingData.children || 0),
          totalPrice: bookingData.totalPrice || 0,
          paymentStatus: 'pending',
          bookingStatus: 'received',
        },
        inquiryId,
        mailConfig,
        overrides: {
          supportEmail: CONTACT_EMAIL,
          supportPhone: process.env.SUPPORT_PHONE || '+91 99555 75969',
        },
      }),
    ]);

    const adminInfo = adminResult.status === 'fulfilled' ? adminResult.value : null;
    const adminFailed = adminResult.status === 'rejected';
    const userInfo = userResult.status === 'fulfilled' ? userResult.value : null;
    const userFailed = userResult.status === 'rejected';

    console.log(`📧 [Booking ${inquiryId}] Email results - Admin: ${adminFailed ? 'FAILED' : 'SUCCESS'}, User: ${userFailed ? 'FAILED' : 'SUCCESS'}`);
    if (adminFailed) console.error(`   Admin error:`, adminResult.reason instanceof Error ? adminResult.reason.message : adminResult.reason);
    if (userFailed) console.error(`   User error:`, userResult.reason instanceof Error ? userResult.reason.message : userResult.reason);

    const emailStatus = adminFailed ? 'pending' : 'sent';
    const userEmailStatus = userFailed ? 'failed' : 'sent';

    console.log(`📊 [Booking ${inquiryId}] Final email status: ${emailStatus}`);

    try {
      const fs = require('fs');
      const filePath = path.join(__dirname, '../inquiries.json');
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        const inquiries = JSON.parse(data || '[]');
        const idx = inquiries.findIndex((i) => i.id === inquiryId);
        if (idx !== -1) {
          inquiries[idx].emailStatus = emailStatus;
          inquiries[idx].adminMessageId = adminInfo?.messageId || adminInfo?.data?.id || null;
          inquiries[idx].userConfirmationEmailStatus = userEmailStatus;
          inquiries[idx].userConfirmationMessageId = userInfo?.messageId || userInfo?.data?.id || null;
          fs.writeFileSync(filePath, JSON.stringify(inquiries, null, 2));
        }
      }
    } catch (err) {
      console.error('Failed to update inquiry status after email send:', err);
    }

    res.json({
      success: true,
      inquiryId,
      message: emailStatus === 'sent'
        ? 'Booking inquiry submitted successfully. Admin notification sent.'
        : 'Booking inquiry submitted successfully. Admin notification is being processed.',
      emailStatus,
      emailResults: {
        admin: adminFailed ? 'failed' : 'sent',
        user: userFailed ? 'failed' : 'sent',
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
