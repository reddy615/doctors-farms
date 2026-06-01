const DEFAULT_SUPPORT_EMAIL = process.env.CONTACT_EMAIL || 'doctorsfarms686@gmail.com';
const DEFAULT_SUPPORT_PHONE = process.env.SUPPORT_PHONE || '+91 99555 75969';

// Email validation pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const trimmed = email.trim();
  return EMAIL_REGEX.test(trimmed) && trimmed.length <= 254;
}

function escapeHtml(value) {
  if (value == null) return '';

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(amount) {
  const parsedAmount = Number(amount || 0);
  return `₹${parsedAmount.toLocaleString('en-IN')}`;
}

function getFirstValue(source, keys, fallback = '') {
  for (const key of keys) {
    if (source && source[key] != null && source[key] !== '') {
      return source[key];
    }
  }

  return fallback;
}

function getGuestCount(data) {
  const adults = Number(getFirstValue(data, ['adults'], 1) || 1);
  const children = Number(getFirstValue(data, ['children'], 0) || 0);
  return adults + children;
}

function getSupportInfo(overrides = {}) {
  return {
    email: overrides.supportEmail || DEFAULT_SUPPORT_EMAIL,
    phone: overrides.supportPhone || DEFAULT_SUPPORT_PHONE,
  };
}

function buildAdminBookingEmail(bookingData, inquiryId) {
  const guestCount = getGuestCount(bookingData);
  const paymentStatus = String(getFirstValue(bookingData, ['paymentStatus', 'payment_status'], 'pending'));
  const bookingStatus = String(getFirstValue(bookingData, ['bookingStatus', 'booking_status'], 'received'));
  const paymentMethod = getFirstValue(bookingData, ['paymentMethod', 'payment_method'], 'Not provided');
  const paymentReference = getFirstValue(
    bookingData,
    ['paymentTransactionId', 'paymentReference', 'transactionId', 'paymentId'],
    'Not provided'
  );
  const stayText = bookingData.checkInDate && bookingData.checkOutDate
    ? `${bookingData.checkInDate} to ${bookingData.checkOutDate}`
    : bookingData.checkInDate || bookingData.stay || 'Not provided';

  return {
    subject: `New booking inquiry from ${bookingData.customerName || bookingData.name || 'Guest'}`,
    text: `New booking inquiry received\n\nInquiry ID: ${inquiryId}\nName: ${bookingData.customerName || bookingData.name || 'Not provided'}\nEmail: ${bookingData.email || 'Not provided'}\nPhone: ${bookingData.phoneNumber || bookingData.phone || 'Not provided'}\nCheck-in: ${bookingData.checkInDate || bookingData.checkIn || 'Not provided'} ${bookingData.checkInTime || ''}\nCheck-out: ${bookingData.checkOutDate || bookingData.checkOut || 'Not provided'} ${bookingData.checkOutTime || ''}\nGuests: ${guestCount} (${Number(getFirstValue(bookingData, ['adults'], 1))} adult(s), ${Number(getFirstValue(bookingData, ['children'], 0))} child(ren))\nRoom type: ${bookingData.roomType || 'Not selected'}\nTotal Price: ${formatCurrency(bookingData.totalPrice || bookingData.totalCost || bookingData.roomPrice || 0)}\nStay: ${stayText}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
        <h2>New Booking Inquiry</h2>
        <p><strong>Inquiry ID:</strong> ${escapeHtml(inquiryId)}</p>
        <p><strong>Name:</strong> ${escapeHtml(bookingData.customerName || bookingData.name || 'Not provided')}</p>
        <p><strong>Email:</strong> ${escapeHtml(bookingData.email || 'Not provided')}</p>
        <p><strong>Phone:</strong> ${escapeHtml(bookingData.phoneNumber || bookingData.phone || 'Not provided')}</p>
        <p><strong>Check-in:</strong> ${escapeHtml(bookingData.checkInDate || bookingData.checkIn || 'Not provided')} ${escapeHtml(bookingData.checkInTime || '')}</p>
        <p><strong>Check-out:</strong> ${escapeHtml(bookingData.checkOutDate || bookingData.checkOut || 'Not provided')} ${escapeHtml(bookingData.checkOutTime || '')}</p>
        <p><strong>Guests:</strong> ${guestCount} (${Number(getFirstValue(bookingData, ['adults'], 1))} adult(s), ${Number(getFirstValue(bookingData, ['children'], 0))} child(ren))</p>
        <p><strong>Room type:</strong> ${escapeHtml(bookingData.roomType || 'Not selected')}</p>
        <p><strong>Total Price:</strong> ${formatCurrency(bookingData.totalPrice || bookingData.totalCost || bookingData.roomPrice || 0)}</p>
        <p><strong>Stay:</strong> ${escapeHtml(stayText)}</p>
      </div>
    `,
  };
}

function buildUserConfirmationEmail(bookingData, inquiryId, overrides = {}) {
  const supportInfo = getSupportInfo(overrides);
  const name = getFirstValue(bookingData, ['customerName', 'name', 'fullName'], 'Guest');
  const email = getFirstValue(bookingData, ['email'], 'Not provided');
  const phone = getFirstValue(bookingData, ['phoneNumber', 'phone'], 'Not provided');
  const roomType = getFirstValue(bookingData, ['roomType'], 'Heritage Cottage');
  const checkIn = getFirstValue(bookingData, ['checkInDate', 'checkIn'], 'Not provided');
  const checkOut = getFirstValue(bookingData, ['checkOutDate', 'checkOut'], 'Not provided');
  const stay = getFirstValue(bookingData, ['stay'], checkIn !== 'Not provided' && checkOut !== 'Not provided' ? `${checkIn} to ${checkOut}` : checkIn);
  const adults = Number(getFirstValue(bookingData, ['adults'], 1) || 1);
  const children = Number(getFirstValue(bookingData, ['children'], 0) || 0);
  const totalPrice = bookingData.totalPrice || bookingData.totalCost || bookingData.roomPrice || 0;
  const paymentStatus = String(getFirstValue(bookingData, ['paymentStatus', 'payment_status'], 'pending'));
  const bookingStatus = String(getFirstValue(bookingData, ['bookingStatus', 'booking_status'], 'received'));
  const paymentMethod = getFirstValue(bookingData, ['paymentMethod', 'payment_method'], 'Not provided');
  const paymentReference = getFirstValue(
    bookingData,
    ['paymentTransactionId', 'paymentReference', 'transactionId', 'paymentId'],
    'Not provided'
  );

  return {
    subject: `Your booking inquiry ${inquiryId} has been received`,
    text: `Hi ${name},\n\nThank you for choosing Doctors Farms Resort. We received your booking inquiry and our team will contact you shortly.\n\nBooking details:\n- Booking ID: ${inquiryId}\n- Name: ${name}\n- Email: ${email}\n- Phone: ${phone}\n- Room type: ${roomType}\n- Check-in: ${checkIn}\n- Check-out: ${checkOut}\n- Guests: ${adults + children} (${adults} adult(s), ${children} child(ren))\n- Total Price: ${formatCurrency(totalPrice)}\n- Stay: ${stay}\n\nSupport contact:\nEmail: ${supportInfo.email}\nPhone: ${supportInfo.phone}\n\nThank you for booking with us.\nDoctors Farms Resort`,
    html: `
      <div style="margin:0;padding:0;background:#f3f7f4;">
        <div style="max-width:680px;margin:0 auto;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
          <div style="background:linear-gradient(135deg,#0f766e,#14532d);color:#fff;padding:28px;border-radius:20px 20px 0 0;">
            <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.85;">Doctors Farms Resort</div>
            <h1 style="margin:10px 0 0;font-size:30px;line-height:1.2;">Booking inquiry received</h1>
            <p style="margin:10px 0 0;font-size:15px;opacity:.95;">Thank you, ${escapeHtml(name)}. We received your request and our team will contact you shortly.</p>
          </div>

          <div style="background:#ffffff;border:1px solid #dbe7df;border-top:none;border-radius:0 0 20px 20px;padding:28px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
              <div style="background:#f8faf8;border:1px solid #e5eee7;border-radius:14px;padding:16px;">
                <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;">Booking ID</div>
                <div style="font-size:18px;font-weight:700;margin-top:6px;">${escapeHtml(inquiryId)}</div>
              </div>
              <div style="background:#f8faf8;border:1px solid #e5eee7;border-radius:14px;padding:16px;">
                <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;">Total Price</div>
                <div style="font-size:18px;font-weight:700;margin-top:6px;">${escapeHtml(formatCurrency(totalPrice))}</div>
              </div>
            </div>

            <div style="margin-top:24px;">
              <h2 style="font-size:18px;margin:0 0 12px;">Your booking details</h2>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr><td style="padding:10px 0;color:#6b7280;width:42%;">Name</td><td style="padding:10px 0;font-weight:600;">${escapeHtml(name)}</td></tr>
                <tr><td style="padding:10px 0;color:#6b7280;">Email</td><td style="padding:10px 0;font-weight:600;">${escapeHtml(email)}</td></tr>
                <tr><td style="padding:10px 0;color:#6b7280;">Phone</td><td style="padding:10px 0;font-weight:600;">${escapeHtml(phone)}</td></tr>
                <tr><td style="padding:10px 0;color:#6b7280;">Room type</td><td style="padding:10px 0;font-weight:600;">${escapeHtml(roomType)}</td></tr>
                <tr><td style="padding:10px 0;color:#6b7280;">Check-in</td><td style="padding:10px 0;font-weight:600;">${escapeHtml(checkIn)}</td></tr>
                <tr><td style="padding:10px 0;color:#6b7280;">Check-out</td><td style="padding:10px 0;font-weight:600;">${escapeHtml(checkOut)}</td></tr>
                <tr><td style="padding:10px 0;color:#6b7280;">Guests</td><td style="padding:10px 0;font-weight:600;">${adults + children} (${adults} adult(s), ${children} child(ren))</td></tr>
                <tr><td style="padding:10px 0;color:#6b7280;">Stay</td><td style="padding:10px 0;font-weight:600;">${escapeHtml(stay)}</td></tr>
              </table>
            </div>

            <div style="margin-top:24px;padding:18px;border-radius:14px;background:#f0fdf4;border:1px solid #bbf7d0;">
              <div style="font-weight:700;margin-bottom:8px;">Thank you for booking with us</div>
              <div style="font-size:14px;line-height:1.7;">Our team is reviewing your inquiry and will get back to you soon with the next steps.</div>
            </div>

            <div style="margin-top:24px;">
              <h2 style="font-size:18px;margin:0 0 12px;">Support contact</h2>
              <p style="margin:0 0 6px;font-size:14px;"><strong>Email:</strong> ${escapeHtml(supportInfo.email)}</p>
              <p style="margin:0;font-size:14px;"><strong>Phone:</strong> ${escapeHtml(supportInfo.phone)}</p>
            </div>
          </div>
        </div>
      </div>
    `,
  };
}

async function sendWithRetry(sendFn, attempts = 3, timeoutMs = 20000, delays = [2000, 5000]) {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await Promise.race([
        sendFn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('send_timeout')), timeoutMs)),
      ]);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const delay = delays[Math.min(attempt - 1, delays.length - 1)];
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Email send failed');
}

async function sendMailWithProvider(mailConfig, mail) {
  const { usingResend, resendClient, transporter, mailFrom, contactEmail } = mailConfig;

  // Validate recipient email
  if (!validateEmail(mail.to)) {
    throw new Error(`Invalid recipient email address: "${mail.to}"`);
  }

  if (usingResend) {
    if (!resendClient) {
      throw new Error('Resend client is not configured');
    }

    const from = mail.from || mailFrom || contactEmail;
    console.log(`[Resend] Sending to: ${mail.to}, from: ${from}`);
    try {
      const result = await resendClient.emails.send({
        from,
        to: mail.to,
        bcc: mail.bcc,
        replyTo: mail.replyTo,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
      console.log(`[Resend] Response:`, result);
      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message || JSON.stringify(result.error)}`);
      }
      return result;
    } catch (resendErr) {
      console.error('[Resend] Error sending email:', resendErr instanceof Error ? resendErr.message : String(resendErr));
      // If SMTP transporter is available, fall back to SMTP for delivery
      if (transporter) {
        console.log('[EmailService] Falling back to SMTP transporter due to Resend error');
        try {
          const smtpResult = await transporter.sendMail({
            from: mail.from || `"Doctors Farms Website" <${mailFrom || contactEmail}>`,
            to: mail.to,
            bcc: mail.bcc,
            replyTo: mail.replyTo,
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
          });
          console.log('[SMTP] Fallback response:', smtpResult);
          return smtpResult;
        } catch (smtpErr) {
          console.error('[SMTP] Fallback also failed:', smtpErr instanceof Error ? smtpErr.message : String(smtpErr));
          throw resendErr;
        }
      }
      throw resendErr;
    }
  }

  if (!transporter) {
    throw new Error('Mail transporter is not configured');
  }

  console.log(`[SMTP] Sending to: ${mail.to}`);
  const result = await transporter.sendMail({
    from: mail.from || `"Doctors Farms Website" <${mailFrom || contactEmail}>`,
    to: mail.to,
    bcc: mail.bcc,
    replyTo: mail.replyTo,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
  console.log(`[SMTP] Response:`, result);
  return result;
}

async function sendAdminNotification({ mail, mailConfig }) {
  if (!mail || !mailConfig) {
    throw new Error('Admin mail payload is required');
  }

  try {
    const result = await sendWithRetry(() => sendMailWithProvider(mailConfig, mail));
    console.log('✅ [EmailService] Admin notification sent successfully');
    return result;
  } catch (error) {
    console.error('❌ [EmailService] Admin notification failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function sendUserConfirmation({ bookingData, inquiryId, mailConfig, overrides = {} }) {
  if (!bookingData || !inquiryId || !mailConfig) {
    throw new Error('User confirmation payload is incomplete');
  }

  const supportInfo = getSupportInfo(overrides);
  const mail = buildUserConfirmationEmail(bookingData, inquiryId, supportInfo);
  const recipient = bookingData.email || bookingData.userEmail;

  if (!recipient) {
    throw new Error(`No recipient email found for user confirmation. bookingData keys: ${Object.keys(bookingData).join(', ')}`);
  }

  console.log(`📧 [EmailService] Attempting to send user confirmation to: ${recipient}`);

  try {
    const result = await sendWithRetry(() => sendMailWithProvider(mailConfig, {
      from: mailConfig.mailFrom || `"Doctors Farms" <${mailConfig.contactEmail || DEFAULT_SUPPORT_EMAIL}>`,
      to: recipient,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    }));
    console.log(`✅ [EmailService] User confirmation sent successfully to: ${recipient}`);
    return result;
  } catch (error) {
    console.error(`❌ [EmailService] User confirmation failed for ${recipient}:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

module.exports = {
  buildAdminBookingEmail,
  buildUserConfirmationEmail,
  sendAdminNotification,
  sendUserConfirmation,
};