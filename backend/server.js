const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const isProduction = process.env.NODE_ENV === 'production';
const frontendRoot = path.resolve(__dirname, '..');

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
  'https://doctors-farms-production.up.railway.app',
  'https://www.doctorsfarms.in',
  'https://doctorsfarms.in',
].filter(Boolean);

console.log('✅ CORS Allowed Origins:', allowedOrigins);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      return callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-JSON-Response-Size'],
    maxAge: 86400,
  })
);

app.options('*', cors({
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

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
  roomType: z.string().max(120).optional().default('Not selected'),
  pricePerNight: z.string().max(80).optional().default('Not provided'),
  roomPrice: z.number().int().nonnegative().optional().default(0),
  message: z.string().min(1, 'Message is required').max(5000),
});

function normalizeInquiryInput(body = {}) {
  return {
    name: body.name || body.fullName,
    email: body.email,
    phone: body.phone,
    stay: body.stay || body.service || body.preferredDate || 'Not provided',
    roomType: body.roomType,
    pricePerNight: body.pricePerNight,
    roomPrice: typeof body.roomPrice === 'number' ? body.roomPrice : Number(body.roomPrice) || 0,
    message: body.message,
  };
}

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

  const { name, email, phone, stay, roomType, pricePerNight, roomPrice, message } = parsed.data;

  const inquiry = {
    id: `INQ_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    name,
    email,
    phone: phone || '',
    stay: stay || 'Not provided',
    roomType: roomType || 'Not selected',
    pricePerNight: pricePerNight || 'Not provided',
    roomPrice: roomPrice || 0,
    message,
    status: 'unpaid',
    createdAt: new Date().toISOString(),
    payment: null,
  };

  const inquiries = readInquiries();
  inquiries.push(inquiry);
  writeInquiries(inquiries);

  const canSendMail = usingResend ? !!resendClient : !!transporter && smtpVerified;

  if (!canSendMail) {
    return res.json({
      success: true,
      message: 'Inquiry saved. Email service is currently unavailable; our team will still follow up.',
      inquiryId: inquiry.id,
      emailStatus: 'pending',
      note: smtpLastError || 'Mail transporter not configured or verified.',
    });
  }

  const adminMail = {
    from: `"Doctors Farms Website" <${MAIL_FROM}>`,
    replyTo: email,
    to: CONTACT_EMAIL,
    bcc: ADMIN_EMAILS,
    subject: `New booking inquiry from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nRoom type: ${roomType || 'Not selected'}\nPrice: ${pricePerNight || 'Not provided'}\nPreferred stay: ${stay}\nPhone: ${phone}\n\nMessage:\n${message}`,
    html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Room type:</strong> ${roomType || 'Not selected'}</p>
      <p><strong>Price:</strong> ${pricePerNight || 'Not provided'}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Preferred stay:</strong> ${stay}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br/>')}</p>
      <p><strong>Inquiry ID:</strong> ${inquiry.id}</p>
    `,
  };

  const userMail = {
    from: `"Doctors Farms" <${MAIL_FROM}>`,
    to: email,
    subject: `Your booking inquiry ${inquiry.id} received`,
    text: `Hi ${name},

Thanks for your inquiry. We received your request and will get back shortly.

Inquiry ID: ${inquiry.id}
Room type: ${inquiry.roomType || 'Not selected'}
Price: ${inquiry.pricePerNight || 'Not provided'}
Stay: ${inquiry.stay}
Phone: ${phone || 'Not provided'}
Message:
${inquiry.message}

Regards,
Doctors Farms`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height:1.6;">
        <h2>Booking Inquiry Received</h2>
        <p>Hi ${name},</p>
        <p>Thank you for reaching out. Your inquiry has been received and we will contact you soon.</p>
        <p><strong>Inquiry ID:</strong> ${inquiry.id}</p>
        <p><strong>Room type:</strong> ${inquiry.roomType || 'Not selected'}</p>
        <p><strong>Price:</strong> ${inquiry.pricePerNight || 'Not provided'}</p>
        <p><strong>Stay:</strong> ${inquiry.stay}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong><br>${inquiry.message.replace(/\n/g, '<br>')}</p>
        <p>Best regards,<br>Doctors Farms Team</p>
      </div>
    `,
  };

  try {
    let adminInfo = null;
    let userInfo = null;
    let emailSendFailed = false;

    if (usingResend) {
      // Try primary sender, fall back to contact email if domain not verified
      const trySendEmail = async (emailData, recipientType) => {
        let lastError = null;
        
        // Attempt 1: Use configured MAIL_FROM
        try {
          console.log(`📧 [RESEND] Attempting to send ${recipientType} email from ${MAIL_FROM}`);
          const result = await resendClient.emails.send({
            from: MAIL_FROM,
            ...emailData,
          });
          
          if (result?.error) {
            lastError = result.error.message || 'Unknown Resend error';
            console.error(`❌ [RESEND] ${recipientType} email failed with MAIL_FROM: ${lastError}`);
          } else if (result?.id) {
            console.log(`✅ [RESEND] ${recipientType} email sent successfully. ID: ${result.id}`);
            return result;
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
          console.error(`❌ [RESEND] ${recipientType} email error with MAIL_FROM: ${lastError}`);
        }
        
        // Attempt 2: Fall back to CONTACT_EMAIL if MAIL_FROM failed
        if (lastError && MAIL_FROM !== CONTACT_EMAIL) {
          try {
            console.log(`📧 [RESEND] Retrying ${recipientType} email from fallback: ${CONTACT_EMAIL}`);
            const result = await resendClient.emails.send({
              from: CONTACT_EMAIL,
              ...emailData,
            });
            
            if (result?.error) {
              lastError = result.error.message || 'Unknown Resend error';
              console.error(`❌ [RESEND] ${recipientType} email failed with fallback: ${lastError}`);
            } else if (result?.id) {
              console.log(`✅ [RESEND] ${recipientType} email sent with fallback. ID: ${result.id}`);
              return result;
            }
          } catch (err) {
            lastError = err instanceof Error ? err.message : String(err);
            console.error(`❌ [RESEND] ${recipientType} email error with fallback: ${lastError}`);
          }
        }
        
        throw new Error(lastError || `Failed to send ${recipientType} email`);
      };

      // Send admin email
      try {
        adminInfo = await trySendEmail({
          to: ADMIN_EMAILS,
          replyTo: email,
          subject: adminMail.subject,
          text: adminMail.text,
          html: adminMail.html,
        }, 'admin');
      } catch (emailError) {
        smtpLastError = emailError instanceof Error ? emailError.message : String(emailError);
        emailSendFailed = true;
      }

      // Send user email
      try {
        userInfo = await trySendEmail({
          to: [email],
          subject: userMail.subject,
          text: userMail.text,
          html: userMail.html,
        }, 'user');
      } catch (emailError) {
        smtpLastError = emailError instanceof Error ? emailError.message : String(emailError);
        emailSendFailed = true;
      }
    } else {
      try {
        adminInfo = await transporter.sendMail(adminMail);
      } catch (emailError) {
        console.error('Admin mail failed:', emailError);
        emailSendFailed = true;
      }

      try {
        userInfo = await transporter.sendMail(userMail);
      } catch (emailError) {
        console.error('User mail failed:', emailError);
        emailSendFailed = true;
      }
    }

    return res.json({
      success: true,
      message: emailSendFailed ? 'Inquiry saved. Email delivery delayed.' : 'Inquiry saved and emails sent.',
      inquiryId: inquiry.id,
      adminMessageId: adminInfo?.messageId || adminInfo?.data?.id || null,
      userMessageId: userInfo?.messageId || userInfo?.data?.id || null,
      emailStatus: emailSendFailed ? 'delayed' : 'sent',
    });
  } catch (error) {
    return res.json({
      success: true,
      message: 'Inquiry saved successfully. Email notifications will be sent shortly.',
      inquiryId: inquiry.id,
      emailStatus: 'pending',
      note: error instanceof Error ? error.message : String(error),
    });
  }
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

app.post('/api/payment-callback', (req, res) => {
  console.log('Payment callback received:', req.body);

  const callbackData = req.body;
  const transactionId = callbackData.merchantTransactionId || callbackData.paymentId;

  if (!transactionId) {
    return res.status(400).json({ success: false, error: 'Missing transaction identifier' });
  }

  const inquiries = readInquiries();
  const inquiry = inquiries.find((inq) => inq.payment?.merchantTransactionId === transactionId);

  if (!inquiry) {
    console.warn('Callback for unknown transaction', transactionId);
    return res.status(404).json({ success: false, error: 'Inquiry not found for transaction' });
  }

  inquiry.status = 'paid';
  inquiry.payment = {
    ...inquiry.payment,
    status: 'paid',
    callback: callbackData,
    updatedAt: new Date().toISOString(),
  };

  writeInquiries(inquiries);

  res.json({ success: true, message: 'Inquiry marked paid', inquiryId: inquiry.id });
});

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
        return res.sendFile(path.join(__dirname, '../dist/index.html'));
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