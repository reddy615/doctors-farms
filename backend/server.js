const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { sendAdminNotification } = require('./services/emailService');
const { sendBookingConfirmationEmail } = require('./services/emailConfirmationService');
const { appendPaymentEvent } = require('./services/webhookLogger');
const {
  readBlockedDates,
  writeBlockedDates,
  hasBlockedDateConflict,
} = require('./services/blockedDatesService');
const {
  applyPaymentWebhookEvent,
  buildPaymentEventLog,
  normalizePhonePeCallback,
} = require('./services/paymentService');
const { createPaymentWebhookRouter } = require('./routes/paymentWebhook');

dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const isProduction = process.env.NODE_ENV === 'production';
const frontendRoot = path.resolve(__dirname, '..');
const frontendDist = path.resolve(__dirname, '../dist');

let vite;

/* ----------------------------- CORS CONFIG ----------------------------- */

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  FRONTEND_URL,
  'https://doctors-farms.onrender.com',
  'https://doctors-farms-production.up.railway.app',
  'https://www.doctorsfarms.in',
  'https://doctorsfarms.in',
  'https://doctorsfarmnunna.in',
  'https://www.doctorsfarmnunna.in',
].filter(Boolean);

console.log('✅ CORS Allowed Origins:', allowedOrigins);

app.use(
  cors({
    origin(origin, callback) {
      // allow requests with no origin (Postman, server-to-server, health checks)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Do NOT throw an error here — return false so the request is rejected by CORS
      // without raising an exception that can crash or be treated as a fatal error.
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-JSON-Response-Size'],
    maxAge: 86400,
  })
);

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.options('*', cors({
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({
  verify(req, res, buf) {
    req.rawBody = Buffer.from(buf);
  },
}));

/* ----------------------------- LOGGING ----------------------------- */

app.use((req, res, next) => {
  console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`   Origin: ${req.get('origin') || 'no origin'}`);
  next();
});

/* ----------------------------- STATIC / VITE ----------------------------- */

function setupStaticFiles() {
  if (isProduction) {
    console.log('📁 Setting up static files from dist/');
    app.use(
      express.static(path.join(__dirname, '../dist'), {
        index: false,
        etag: false,
      })
    );
  }
}

async function setupFrontendMiddleware() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    vite = await createServer({
      root: frontendRoot,
      configFile: path.resolve(frontendRoot, 'vite.config.ts'),
      appType: 'custom',
      server: {
        middlewareMode: true,
      },
    });
  }
}

/* ----------------------------- HEALTH ROUTES ----------------------------- */

function sendFrontendOrHomepage(req, res) {
  const distIndex = path.join(frontendDist, 'index.html');

  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }

  return res.status(200).send('Doctors Farms Website is Running');
}

app.get('/', sendFrontendOrHomepage);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API Backend is alive and responding',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: [
      'GET /health',
      'GET /api/health',
      'GET /api/health/mail',
      'GET /api/blocked-dates',
      'PUT /api/blocked-dates',
      'POST /api/send-mail',
      'POST /api/inquiries',
      'GET /api/inquiries',
      'GET /api/admins',
      'POST /api/create-payment',
      'POST /api/payment-callback',
    ],
  });
});

/* ----------------------------- INQUIRY STORAGE ----------------------------- */

const INQUIRIES_FILE = path.join(__dirname, 'inquiries.json');

function readInquiries() {
  try {
    if (!fs.existsSync(INQUIRIES_FILE)) {
      fs.writeFileSync(INQUIRIES_FILE, '[]', 'utf-8');
    }
    return JSON.parse(fs.readFileSync(INQUIRIES_FILE, 'utf-8'));
  } catch (err) {
    console.error('Error reading inquiries file:', err);
    return [];
  }
}

function writeInquiries(inquiries) {
  try {
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing inquiries file:', err);
  }
}

app.get('/api/blocked-dates', (req, res) => {
  res.json({ success: true, blockedDates: readBlockedDates() });
});

app.put('/api/blocked-dates', (req, res) => {
  try {
    const requestedDates = Array.isArray(req.body?.blockedDates) ? req.body.blockedDates : [];
    const blockedDates = writeBlockedDates(requestedDates);

    res.json({ success: true, blockedDates });
  } catch (error) {
    console.error('Failed to update blocked dates:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update blocked dates',
    });
  }
});

/* ----------------------------- MAIL CONFIG ----------------------------- */

const MAIL_PROVIDER = (process.env.MAIL_PROVIDER || 'custom').toLowerCase();

const MAIL_PRESETS = {
  gmail: { host: 'smtp.gmail.com', port: 587, secure: false },
  brevo: { host: 'smtp-relay.brevo.com', port: 587, secure: false },
  resend: null,
  custom: null,
};

const MAIL_PRESET = MAIL_PRESETS[MAIL_PROVIDER] || MAIL_PRESETS.custom;

const SMTP_HOST = process.env.SMTP_HOST || MAIL_PRESET?.host || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || MAIL_PRESET?.port || 587);
const SMTP_SECURE =
  String(process.env.SMTP_SECURE ?? MAIL_PRESET?.secure ?? false).toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'doctorsfarms686@gmail.com';
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER || CONTACT_EMAIL;
const ADMIN_LIST = process.env.ADMIN_LIST || CONTACT_EMAIL;
const ADMIN_EMAILS = ADMIN_LIST.split(',').map((item) => item.trim()).filter(Boolean);

let transporter;
let smtpVerified = false;
let smtpLastError = null;
const usingResend = MAIL_PROVIDER === 'resend';
const resendClient = usingResend && RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

function getMailConfig() {
  return {
    usingResend,
    resendClient,
    transporter,
    mailFrom: MAIL_FROM,
    contactEmail: CONTACT_EMAIL,
  };
}

if (!usingResend && SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  transporter.verify((error) => {
    if (error) {
      smtpVerified = false;
      smtpLastError = error instanceof Error ? error.message : String(error);
      console.error('❌ SMTP transporter verification failed:', error);
    } else {
      smtpVerified = true;
      smtpLastError = null;
      console.log('✅ SMTP transporter verified successfully');
    }
  });

  console.log('✅ SMTP transporter configured for:', SMTP_USER);
  console.log('✅ MAIL_PROVIDER:', MAIL_PROVIDER);
} else if (usingResend) {
  if (resendClient) {
    console.log('✅ Resend client configured');
  } else {
    smtpLastError = 'RESEND_API_KEY is missing while MAIL_PROVIDER=resend.';
    console.warn('⚠️ Resend configuration incomplete: RESEND_API_KEY missing');
  }
  console.log('✅ MAIL_PROVIDER:', MAIL_PROVIDER);
} else {
  console.warn('⚠️ SMTP configuration incomplete');
}

/* ----------------------------- MAIL HEALTH ----------------------------- */

app.get('/api/health/mail', (req, res) => {
  const configured = usingResend ? !!resendClient : !!transporter;
  const healthy = usingResend ? !!resendClient : !!transporter && smtpVerified;

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    backendReachable: true,
    provider: MAIL_PROVIDER,
    smtpConfigured: configured,
    smtpVerified: healthy,
    message: healthy
      ? 'Mail service is ready.'
      : smtpLastError
        ? `Mail service unavailable: ${smtpLastError}`
        : 'Mail service is not configured or not verified.',
  });
});

app.get('/api/debug/cors', (req, res) => {
  res.json({
    origin: req.get('origin'),
    method: req.method,
    cors_allowed_origins: allowedOrigins,
    frontend_url: FRONTEND_URL,
    backend_url: BACKEND_URL,
    request_headers: req.headers,
  });
});

app.get('/api/debug/config', (req, res) => {
  res.json({
    frontend_url: FRONTEND_URL,
    backend_url: BACKEND_URL,
    phonepe_env: process.env.PHONEPE_ENV || 'production',
    smtp_configured: usingResend ? !!resendClient : !!transporter,
    mail_provider: MAIL_PROVIDER,
    smtp_user: SMTP_USER ? SMTP_USER.substring(0, 3) + '***' : 'not configured',
    admin_emails: ADMIN_EMAILS,
    environment: process.env.NODE_ENV || 'development',
    smtp_debug: {
      smtp_host: process.env.SMTP_HOST || 'NOT SET',
      smtp_port: process.env.SMTP_PORT || 'NOT SET (default: 587)',
      smtp_user: process.env.SMTP_USER ? 'SET' : 'NOT SET',
      smtp_pass: process.env.SMTP_PASS ? 'SET' : 'NOT SET',
      resend_api_key: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
      smtp_secure: process.env.SMTP_SECURE || 'false (default)',
      transporter_status: usingResend
        ? resendClient
          ? 'RESEND CLIENT READY'
          : 'RESEND NOT CONFIGURED'
        : transporter
          ? smtpVerified
            ? 'VERIFIED'
            : 'CREATED BUT NOT VERIFIED'
          : 'NOT CONFIGURED',
      smtp_verified: usingResend ? !!resendClient : smtpVerified,
      last_smtp_error: smtpLastError,
    },
  });
});

/* ----------------------------- LIMITER + VALIDATION ----------------------------- */

const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many inquiries submitted. Please try again later.',
  },
});

const inquirySchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  email: z.string().email('Valid email is required'),
  phone: z
    .string()
    .refine((phone) => {
      const digitsOnly = phone.replace(/\D/g, '');
      return digitsOnly.length === 0 || digitsOnly.length === 10 || digitsOnly.length === 12;
    }, 'Phone must be 10 digits or include country code')
    .optional()
    .default(''),
  stay: z.string().max(100).optional().default('Not provided'),
  checkIn: z.string().optional().default(''),
  checkOut: z.string().optional().default(''),
  roomType: z.string().max(120).optional().default('Not selected'),
  pricePerNight15000: z.string().max(80).optional().default('Not provided'),
  roomPrice: z.number().int().nonnegative().optional().default(0),
  totalCost: z.number().int().nonnegative().optional().default(0),
  message: z
    .string()
    .max(5000)
    .optional()
    .default('Not provided')
    .transform((value) => value.trim() || 'Not provided'),
});

function normalizeInquiryInput(body = {}) {
  return {
    name: body.name || body.fullName,
    email: body.email,
    phone: body.phone,
    checkIn: body.checkIn || body.check_in || '',
    checkOut: body.checkOut || body.check_out || '',
    stay: body.stay || (body.checkIn ? `${body.checkIn} to ${body.checkOut || 'N/A'}` : body.service || body.preferredDate || 'Not provided'),
    roomType: body.roomType,
    pricePerNight: body.pricePerNight,
    roomPrice: typeof body.roomPrice === 'number' ? body.roomPrice : Number(body.roomPrice) || 0,
    totalCost: typeof body.totalCost === 'number' ? body.totalCost : Number(body.totalCost) || 0,
    message: body.message,
  };
}

/* ----------------------------- TEST EMAIL ENDPOINT ----------------------------- */

app.post('/api/test-email', async (req, res) => {
  const { testEmail, testType } = req.body;

  if (!testEmail) {
    return res.status(400).json({
      success: false,
      message: 'testEmail parameter required',
    });
  }

  console.log(`🧪 [TEST-EMAIL] Testing ${testType || 'user'} email to: ${testEmail}`);

  try {
    const mailConfig = {
      usingResend,
      resendClient,
      transporter,
      mailFrom: MAIL_FROM,
      contactEmail: CONTACT_EMAIL,
    };

    const testData = {
      id: `TEST_${Date.now()}`,
      name: 'Test User',
      email: testEmail,
      phone: '+91 9999999999',
      roomType: 'Test Room',
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      totalPrice: 5000,
    };

    if (testType === 'admin' || !testType) {
      const adminMail = {
        from: `"Doctors Farms Test" <${MAIL_FROM}>`,
        to: CONTACT_EMAIL,
        subject: '[TEST] Admin notification test',
        html: `<p>This is a test admin notification for email: ${testEmail}</p><p>Timestamp: ${new Date().toISOString()}</p>`,
      };

      try {
        const adminResult = await sendAdminNotification({ mail: adminMail, mailConfig });
        console.log('✅ Admin test email sent:', adminResult);
        return res.json({
          success: true,
          message: 'Test admin email sent successfully',
          provider: usingResend ? 'Resend' : 'SMTP',
          result: { messageId: adminResult?.messageId || adminResult?.data?.id },
        });
      } catch (error) {
        console.error('❌ Admin test email failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Admin test email failed',
          error: error instanceof Error ? error.message : String(error),
          provider: usingResend ? 'Resend' : 'SMTP',
        });
      }
    } else if (testType === 'user') {
      return res.status(400).json({
        success: false,
        message: 'User test emails are disabled. Admin delivery is the only active mail path.',
        provider: usingResend ? 'Resend' : 'SMTP',
      });
    }
  } catch (error) {
    console.error('❌ [TEST-EMAIL] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Test email endpoint error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/* ----------------------------- INQUIRY HANDLER ----------------------------- */

async function submitInquiry(req, res) {
  console.log('📧 [INQUIRY] Request received');

  const parsed = inquirySchema.safeParse(normalizeInquiryInput(req.body));
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.flatten(),
    });
  }

  const { name, email, phone, stay, roomType, pricePerNight, roomPrice, totalCost, message, checkIn, checkOut } = parsed.data;

  if (hasBlockedDateConflict(checkIn, checkOut)) {
    return res.status(400).json({
      success: false,
      message: 'Selected date is blocked',
      error: 'One or more selected dates are blocked by the admin.',
    });
  }

  const inquiry = {
    id: `INQ_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    name,
    email,
    phone: phone || '',
    stay: stay || 'Not provided',
    checkIn: checkIn || '',
    checkOut: checkOut || '',
    roomType: roomType || 'Not selected',
    pricePerNight: pricePerNight || 'Not provided',
    roomPrice: roomPrice || 0,
    totalCost: totalCost || roomPrice || 0,
    message,
    status: 'unpaid',
    bookingStatus: 'received',
    paymentStatus: 'pending',
    bookingEvents: [],
    createdAt: new Date().toISOString(),
    payment: null,
  };

  const inquiries = readInquiries();
  inquiries.push(inquiry);
  writeInquiries(inquiries);
  const adminMail = {
    from: `"Doctors Farms Website" <${MAIL_FROM}>`,
    replyTo: email,
    to: CONTACT_EMAIL,
    bcc: ADMIN_EMAILS,
    subject: `New booking inquiry from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nRoom type: ${roomType || 'Not selected'}\nPrice per night: ${pricePerNight || 'Not provided'}\nTotal cost: ${totalCost || roomPrice || 'Not provided'}\nCheck-in: ${checkIn || 'Not provided'}\nCheck-out: ${checkOut || 'Not provided'}\nPhone: ${phone}\n\nMessage:\n${message}`,
    html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Room type:</strong> ${roomType || 'Not selected'}</p>
      <p><strong>Price per night:</strong> ${pricePerNight || 'Not provided'}</p>
      <p><strong>Total cost:</strong> ${totalCost || roomPrice || 'Not provided'}</p>
      <p><strong>Check-in:</strong> ${checkIn || 'Not provided'}</p>
      <p><strong>Check-out:</strong> ${checkOut || 'Not provided'}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br/>')}</p>
      <p><strong>Inquiry ID:</strong> ${inquiry.id}</p>
    `,
  };

  const mailConfig = {
    usingResend,
    resendClient,
    transporter,
    mailFrom: MAIL_FROM,
    contactEmail: CONTACT_EMAIL,
  };

  const [adminResult, userResult] = await Promise.allSettled([
    sendAdminNotification({ mail: adminMail, mailConfig }),
    sendBookingConfirmationEmail({
      bookingData: {
        customerName: name,
        email,
        phoneNumber: phone || '',
        roomType: roomType || 'Not selected',
        checkInDate: checkIn || '',
        checkOutDate: checkOut || '',
        adults: Number(parsed.data.adults || 1),
        children: Number(parsed.data.children || 0),
        totalPrice: totalCost || roomPrice || 0,
        paymentStatus: 'pending',
        bookingStatus: 'received',
      },
      inquiryId: inquiry.id,
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

  console.log(`📧 [Inquiry ${inquiry.id}] Email results - Admin: ${adminFailed ? 'FAILED' : 'SUCCESS'}, User: ${userFailed ? 'FAILED' : 'SUCCESS'}`);
  if (adminFailed) console.error(`   Admin error:`, adminResult.reason instanceof Error ? adminResult.reason.message : adminResult.reason);
  if (userFailed) console.error(`   User error:`, userResult.reason instanceof Error ? userResult.reason.message : userResult.reason);

  if (adminFailed) {
    const failure = adminResult.reason;
    smtpLastError = failure instanceof Error ? failure.message : failure ? String(failure) : smtpLastError;
  }

  const emailStatus = adminFailed ? 'pending' : 'sent';
  const userEmailStatus = userFailed ? 'failed' : 'sent';

  console.log(`📊 [Inquiry ${inquiry.id}] Final email status: ${emailStatus}`);

  const updatedInquiries = readInquiries();
  const idx = updatedInquiries.findIndex((i) => i.id === inquiry.id);
  if (idx !== -1) {
    updatedInquiries[idx].emailStatus = emailStatus;
    updatedInquiries[idx].adminMessageId = adminInfo?.messageId || adminInfo?.data?.id || null;
    updatedInquiries[idx].userConfirmationEmailStatus = userEmailStatus;
    updatedInquiries[idx].userConfirmationMessageId = userInfo?.messageId || userInfo?.data?.id || null;
    writeInquiries(updatedInquiries);
  }

  res.json({
    success: true,
    message: emailStatus === 'sent'
      ? 'Inquiry saved and admin notification was sent.'
      : 'Inquiry saved. Admin notification could not be delivered, but the inquiry was stored.',
    inquiryId: inquiry.id,
    emailStatus,
    emailResults: {
      admin: adminFailed ? 'failed' : 'sent',
      user: userFailed ? 'failed' : 'sent',
    },
  });
}

app.post('/api/send-mail', inquiryLimiter, submitInquiry);
app.post('/api/inquiries', inquiryLimiter, submitInquiry);

app.get('/api/inquiries', (req, res) => {
  const status = req.query.status;
  let inquiries = readInquiries();

  if (status) {
    inquiries = inquiries.filter((inq) => inq.status === status);
  }

  res.json({ success: true, inquiries });
});

app.get('/api/inquiries/:id', (req, res) => {
  const inquiries = readInquiries();
  const inquiry = inquiries.find((inq) => inq.id === req.params.id);

  if (!inquiry) {
    return res.status(404).json({ success: false, error: 'Inquiry not found' });
  }

  res.json({ success: true, inquiry });
});

app.get('/api/admins', (req, res) => {
  const admins = ADMIN_EMAILS.map((email, index) => ({
    id: `admin_${index + 1}`,
    name: email.split('@')[0],
    email,
  }));

  res.json({ success: true, admins });
});

// Admin: Mail metrics - counts of inquiry email statuses and last SMTP error
app.get('/api/admin/mail-metrics', (req, res) => {
  try {
    const inquiries = readInquiries();
    const counts = inquiries.reduce((acc, i) => {
      const status = i.emailStatus || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      metrics: {
        totalInquiries: inquiries.length,
        emailStatusCounts: counts,
        lastSmtpError: smtpLastError || null,
        smtpVerified: usingResend ? !!resendClient : smtpVerified,
        mailProvider: MAIL_PROVIDER,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

/* ----------------------------- PHONEPE ----------------------------- */

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'YOUR_MERCHANT_ID';
const SALT_KEY = process.env.PHONEPE_SALT_KEY || 'YOUR_SALT_KEY';
const SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX || '1', 10);

const PHONEPE_BASE_URL =
  process.env.PHONEPE_ENV === 'sandbox'
    ? 'https://api-sandbox.phonepe.com/apis/hermes'
    : 'https://api.phonepe.com/apis/hermes';

function generateHash(data) {
  const hashString = data + SALT_KEY;
  return crypto.createHash('sha256').update(hashString).digest('hex') + '###' + SALT_INDEX;
}

app.post('/api/create-payment', async (req, res) => {
  const { amount, inquiryId } = req.body;

  const inquiries = readInquiries();
  const inquiry = inquiryId ? inquiries.find((i) => i.id === inquiryId) : null;
  const merchantTransactionId = 'TXN_' + Date.now();

  if (inquiry) {
    inquiry.payment = {
      status: 'initiated',
      merchantTransactionId,
      amount,
      updatedAt: new Date().toISOString(),
    };
    inquiry.status = 'payment_initiated';
    inquiry.paymentStatus = 'initiated';
    inquiry.bookingStatus = 'payment_pending';
    inquiry.bookingEvents = Array.isArray(inquiry.bookingEvents) ? inquiry.bookingEvents : [];
    inquiry.bookingEvents.push({
      id: `PAY_EVT_${Date.now()}`,
      provider: 'phonepe',
      eventType: 'payment.initiated',
      status: 'pending',
      inquiryId: inquiry.id,
      transactionId: merchantTransactionId,
      amount,
      currency: 'INR',
      source: 'server.create-payment',
      receivedAt: new Date().toISOString(),
    });
    writeInquiries(inquiries);
  }

  const payload = {
    merchantId: MERCHANT_ID,
    merchantTransactionId,
    merchantUserId: 'USER_' + Date.now(),
    amount: amount * 100,
    redirectUrl: `${FRONTEND_URL}/payment-success`,
    redirectMode: 'REDIRECT',
    callbackUrl: `${BACKEND_URL}/api/payment-callback`,
    mobileNumber: '9999999999',
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const hash = generateHash(base64Payload);

  try {
    const response = await axios.post(
      `${PHONEPE_BASE_URL}/pg/v1/pay`,
      { request: base64Payload },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': hash,
        },
      }
    );

    res.json({
      success: true,
      paymentUrl: response.data.data.instrumentResponse.redirectInfo.url,
    });
  } catch (error) {
    console.error('Payment creation failed:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Payment creation failed' });
  }
});

app.post('/api/payment-callback', async (req, res) => {
  console.log('Payment callback received:', req.body);

  const callbackData = req.body || {};
  const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(callbackData);
  const normalizedEvent = normalizePhonePeCallback(callbackData, rawBody);
  const transactionId = normalizedEvent.transactionId;

  if (!transactionId) {
    return res.status(400).json({ success: false, error: 'Missing transaction identifier' });
  }

  const inquiries = readInquiries();
  const result = applyPaymentWebhookEvent(inquiries, normalizedEvent);

  if (!result.found) {
    console.warn('Callback for unknown transaction', transactionId);
    return res.status(404).json({ success: false, error: 'Inquiry not found for transaction' });
  }

  writeInquiries(inquiries);
  appendPaymentEvent(buildPaymentEventLog(normalizedEvent, result.inquiry, { source: 'legacy-callback' }));

  if (normalizedEvent.status === 'paid') {
    try {
      await sendBookingConfirmationEmail({
        bookingData: result.bookingData,
        inquiryId: result.inquiry.id,
        mailConfig: getMailConfig(),
        overrides: {
          supportEmail: CONTACT_EMAIL,
          supportPhone: process.env.SUPPORT_PHONE || '+91 99555 75969',
        },
      });

      result.inquiry.paymentConfirmationStatus = 'sent';
      result.inquiry.paymentConfirmationSentAt = new Date().toISOString();
      writeInquiries(inquiries);
    } catch (emailError) {
      console.error('Payment confirmation email failed:', emailError instanceof Error ? emailError.message : String(emailError));
      result.inquiry.paymentConfirmationStatus = 'failed';
      result.inquiry.paymentConfirmationError = emailError instanceof Error ? emailError.message : String(emailError);
      writeInquiries(inquiries);
    }
  }

  res.json({
    success: true,
    message: normalizedEvent.status === 'paid' ? 'Inquiry marked paid' : 'Inquiry payment failure recorded',
    inquiryId: result.inquiry.id,
    paymentStatus: normalizedEvent.status,
  });
});

const paymentWebhookRouter = createPaymentWebhookRouter({
  readInquiries,
  writeInquiries,
  getMailConfig,
  configuredProvider: process.env.PAYMENT_PROVIDER || 'auto',
  contactEmail: CONTACT_EMAIL,
  supportPhone: process.env.SUPPORT_PHONE || '+91 99555 75969',
});

app.use('/api', paymentWebhookRouter);

/* ----------------------------- CHATBOT ----------------------------- */

const chatRoutes = require('./routes/chatRoutes');
app.use('/api', chatRoutes);

console.log('✅ ChatBot API routes mounted');

/* ----------------------------- START SERVER ----------------------------- */

async function start() {
  setupStaticFiles();
  await setupFrontendMiddleware();

  if (!isProduction && vite) {
    app.use(vite.middlewares);
  }

  app.use(async (req, res, next) => {
    try {
      if (req.path.startsWith('/api') || req.method !== 'GET') {
        return next();
      }

      const acceptHeader = req.headers.accept || '';
      if (!acceptHeader.includes('text/html')) {
        return next();
      }

      if (isProduction) {
        return sendFrontendOrHomepage(req, res);
      }

      const template = fs.readFileSync(path.resolve(frontendRoot, 'index.html'), 'utf-8');
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      return res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (error) {
      console.error('❌ [Fallback Error]', error.message);
      if (!isProduction && vite) {
        vite.ssrFixStacktrace(error);
      }
      next(error);
    }
  });

  const PORT = process.env.PORT || (isProduction ? 5000 : 5174);
  const HOST = process.env.HOST || '0.0.0.0';

  app.listen(PORT, HOST, () => {
    console.log(`✅ Backend server running on ${HOST}:${PORT}`);
    console.log(`✅ Frontend URL: ${FRONTEND_URL}`);
    console.log(`✅ Backend URL: ${BACKEND_URL}`);
    console.log(`✅ PhonePe Environment: ${process.env.PHONEPE_ENV || 'production'}`);
  });
}

start().catch((error) => {
  console.error('Failed to start backend server:', error);
  process.exit(1);
});