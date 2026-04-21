const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const app = express();

// CORS configuration for production deployment
const allowedOrigins = [
  'http://localhost:5174',
  'http://localhost:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  process.env.FRONTEND_URL || 'http://localhost:5174',
  process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null,
].filter(Boolean);

console.log('✅ CORS Allowed Origins:', allowedOrigins);

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log but don't block - for debugging
      console.warn(`⚠️  CORS: Origin not in whitelist: ${origin}`);
      // Temporarily allow for testing - comment out restrictive line below
      callback(null, true); // Allow all origins for now
      // callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Preflight requests
app.options('*', cors());

app.use(express.json());

const isProduction = process.env.NODE_ENV === 'production';
const frontendRoot = path.resolve(__dirname, '..');

let vite;

async function setupFrontendMiddleware() {
  if (isProduction) {
    app.use(express.static(path.join(__dirname, '../dist')));
    return;
  }

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

// Health check endpoints - for testing backend availability
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
      'POST /api/send-mail',
      'GET /api/inquiries',
      'GET /api/admins',
      'POST /api/create-payment',
      'POST /api/payment-callback',
    ],
  });
});

// Mail health endpoint for frontend precheck UI
app.get('/api/health/mail', (req, res) => {
  const configured = usingResend ? !!resendClient : !!transporter;
  const healthy = usingResend ? !!resendClient : (!!transporter && smtpVerified);

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

// Debug endpoint - shows CORS info
app.get('/api/debug/cors', (req, res) => {
  res.json({
    origin: req.get('origin'),
    method: req.method,
    cors_allowed_origins: allowedOrigins,
    frontend_url: process.env.FRONTEND_URL || 'http://localhost:5174',
    backend_url: process.env.BACKEND_URL || 'http://localhost:5000',
    request_headers: req.headers,
  });
});

// Debug endpoint - shows current configuration
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
    // Enhanced SMTP debugging
    smtp_debug: {
      smtp_host: process.env.SMTP_HOST || '❌ NOT SET - check Railway variables',
      smtp_port: process.env.SMTP_PORT || 'NOT SET (default: 587)',
      smtp_user: process.env.SMTP_USER ? '✅ SET (hidden)' : '❌ NOT SET',
      smtp_pass: process.env.SMTP_PASS ? '✅ SET (hidden)' : '❌ NOT SET',
      resend_api_key: process.env.RESEND_API_KEY ? '✅ SET (hidden)' : '❌ NOT SET',
      smtp_secure: process.env.SMTP_SECURE || 'false (default)',
      transporter_status: usingResend
        ? (resendClient ? '✅ RESEND CLIENT READY' : '❌ RESEND NOT CONFIGURED')
        : (transporter ? (smtpVerified ? '✅ VERIFIED - emails can be sent' : '⚠️ CREATED BUT NOT VERIFIED - check credentials') : '❌ NOT CONFIGURED - emails will fail'),
      smtp_verified: usingResend ? !!resendClient : smtpVerified,
      last_smtp_error: smtpLastError,
      fix_if_failing: 'Add SMTP_HOST, SMTP_USER, SMTP_PASS to Railway Backend variables and redeploy',
    },
    // API endpoint status
    endpoint_status: {
      health: '✅ available',
      send_mail: usingResend
        ? (resendClient ? '✅ available' : '❌ disabled (Resend not configured)')
        : (transporter && smtpVerified ? '✅ available' : '❌ disabled (SMTP not verified)'),
      inquiries: '✅ available',
      create_payment: '✅ available',
    },
  });
});

const INQUIRIES_FILE = path.join(__dirname, 'inquiries.json');

function readInquiries() {
  try {
    if (!fs.existsSync(INQUIRIES_FILE)) {
      fs.writeFileSync(INQUIRIES_FILE, '[]', 'utf-8');
    }
    const data = fs.readFileSync(INQUIRIES_FILE, 'utf-8');
    return JSON.parse(data);
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

// Email configuration
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

// ADMIN_LIST can be comma-separated values, e.g. ADMIN_LIST=admin1@example.com,admin2@example.com
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

  // Verify transporter configuration
  transporter.verify((error, success) => {
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
    console.warn('⚠️  Resend configuration incomplete: RESEND_API_KEY missing');
  }
  console.log('✅ MAIL_PROVIDER:', MAIL_PROVIDER);
} else {
  console.warn('⚠️  SMTP configuration incomplete:');
  console.warn('   SMTP_HOST:', SMTP_HOST ? '✓' : '✗');
  console.warn('   SMTP_USER:', SMTP_USER ? '✓' : '✗');
  console.warn('   SMTP_PASS:', SMTP_PASS ? '✓ (hidden)' : '✗');
}

// Frontend URLs for redirects (use environment variables for deployment)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';
const BACKEND_URL = process.env.BACKEND_URL || FRONTEND_URL;

// PhonePe configuration (replace with your actual credentials)
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'YOUR_MERCHANT_ID';
const SALT_KEY = process.env.PHONEPE_SALT_KEY || 'YOUR_SALT_KEY';
const SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX || '1');
const PHONEPE_BASE_URL = process.env.PHONEPE_ENV === 'sandbox' 
  ? 'https://api-sandbox.phonepe.com/apis/hermes'
  : 'https://api.phonepe.com/apis/hermes';

console.log(`✅ Frontend URL: ${FRONTEND_URL}`);
console.log(`✅ Backend URL: ${BACKEND_URL}`);
console.log(`✅ PhonePe Environment: ${process.env.PHONEPE_ENV || 'production'}`);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`  Origin: ${req.get('origin') || 'no origin'}`);
  console.log(`  IP: ${req.ip}`);
  next();
});

// Send mail route for contact form notifications
app.post('/api/send-mail', async (req, res) => {
  console.log('📧 [SEND-MAIL] Request received');
  console.log('   [DEBUG] Transporter configured:', !!transporter);
  console.log('   [DEBUG] SMTP verified:', smtpVerified);
  console.log('   [DEBUG] SMTP_USER env:', process.env.SMTP_USER ? '✓ Set' : '✗ NOT SET');
  console.log('   [DEBUG] SMTP_PASS env:', process.env.SMTP_PASS ? '✓ Set' : '✗ NOT SET');
  console.log('   [DEBUG] SMTP_HOST env:', process.env.SMTP_HOST || '✗ NOT SET');
  console.log('   [DEBUG] Request body fields:', Object.keys(req.body).join(', '));

  const { name, email, phone, stay, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Name, email and message are required.' });
  }

  const inquiry = {
    id: `INQ_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    name,
    email,
    phone: phone || '',
    stay: stay || 'N/A',
    message,
    status: 'unpaid',
    createdAt: new Date().toISOString(),
    payment: null,
  };

  const inquiries = readInquiries();
  inquiries.push(inquiry);
  writeInquiries(inquiries);

  const canSendMail = usingResend ? !!resendClient : (!!transporter && smtpVerified);

  if (!canSendMail) {
    console.warn('⚠️ [SEND-MAIL] Inquiry saved but SMTP is unavailable. Returning pending email status.');
    return res.json({
      success: true,
      message: 'Inquiry saved. Email service is currently unavailable; our team will still follow up.',
      inquiryId: inquiry.id,
      emailStatus: 'pending',
      note: smtpLastError || 'SMTP transporter not configured or not verified.',
    });
  }

  const mailData = {
    // Gmail often blocks arbitrary "from" addresses. Use account sender + replyTo.
    from: `"Doctors Farms Website" <${MAIL_FROM}>`,
    replyTo: email,
    to: CONTACT_EMAIL,
    bcc: ADMIN_EMAILS,
    subject: `New booking inquiry from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nPreferred stay: ${stay || 'N/A'}\n\nMessage:\n${message}`,
    html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Preferred stay:</strong> ${stay || 'N/A'}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br/>')}</p>
      <p><strong>Inquiry ID:</strong> ${inquiry.id}</p>
      <p><strong>Admin Recipients:</strong> ${ADMIN_EMAILS.join(', ')}</p>
    `,
  };

  const adminMail = mailData;
  const userMail = {
    from: `"Doctors Farms" <${MAIL_FROM}>`,
    to: email,
    subject: `Your booking inquiry ${inquiry.id} received`,
    text: `Hi ${name},\n\nThanks for your inquiry. We received your request and will get back shortly.\n\nInquiry ID: ${inquiry.id}\nStay: ${inquiry.stay}\nMessage:\n${inquiry.message}\n\nRegards,\nDoctors Farms`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height:1.6;">
        <h2>Booking Inquiry Received</h2>
        <p>Hi ${name},</p>
        <p>Thank you for reaching out. Your inquiry has been received and we will contact you soon.</p>
        <p><strong>Inquiry ID:</strong> ${inquiry.id}</p>
        <p><strong>Stay:</strong> ${inquiry.stay}</p>
        <p><strong>Message:</strong><br>${inquiry.message.replace(/\n/g, '<br>')}</p>
        <p>Best regards,<br>Doctors Farms Team</p>
      </div>
    `,
  };

  try {
    let adminInfo, userInfo;
    let emailSendFailed = false;

    if (usingResend) {
      try {
        console.log('   [INFO] Attempting to send admin email via Resend to:', ADMIN_EMAILS);
        adminInfo = await resendClient.emails.send({
          from: MAIL_FROM,
          to: ADMIN_EMAILS,
          replyTo: email,
          subject: adminMail.subject,
          text: adminMail.text,
          html: adminMail.html,
        });
        if (adminInfo?.error) {
          throw new Error(adminInfo.error.message || 'Unknown Resend admin email error');
        }
        console.log('   ✅ [INFO] Admin email sent via Resend:', adminInfo?.data?.id || 'no-id');
      } catch (emailError) {
        console.error('   ❌ [ERROR] Admin email failed:', emailError instanceof Error ? emailError.message : emailError);
        smtpLastError = emailError instanceof Error ? emailError.message : String(emailError);
        emailSendFailed = true;
      }

      try {
        console.log('   [INFO] Attempting to send user email via Resend to:', email);
        userInfo = await resendClient.emails.send({
          from: MAIL_FROM,
          to: [email],
          subject: userMail.subject,
          text: userMail.text,
          html: userMail.html,
        });
        if (userInfo?.error) {
          throw new Error(userInfo.error.message || 'Unknown Resend customer email error');
        }
        console.log('   ✅ [INFO] User email sent via Resend:', userInfo?.data?.id || 'no-id');
      } catch (emailError) {
        console.error('   ❌ [ERROR] User email failed:', emailError instanceof Error ? emailError.message : emailError);
        smtpLastError = emailError instanceof Error ? emailError.message : String(emailError);
        emailSendFailed = true;
      }
    } else {
      try {
        console.log('   [INFO] Attempting to send admin email to:', ADMIN_EMAILS);
        adminInfo = await transporter.sendMail(adminMail);
        console.log('   ✅ [INFO] Admin email sent:', adminInfo.messageId);
      } catch (emailError) {
        console.error('   ❌ [ERROR] Admin email failed:', emailError instanceof Error ? emailError.message : emailError);
        emailSendFailed = true;
      }

      try {
        console.log('   [INFO] Attempting to send user email to:', email);
        userInfo = await transporter.sendMail(userMail);
        console.log('   ✅ [INFO] User email sent:', userInfo.messageId);
      } catch (emailError) {
        console.error('   ❌ [ERROR] User email failed:', emailError instanceof Error ? emailError.message : emailError);
        emailSendFailed = true;
      }
    }

    console.log('   [INFO] Inquiry saved with ID:', inquiry.id);
    const responseData = {
      success: true,
      message: emailSendFailed ? 'Inquiry saved. Email delivery delayed.' : 'Inquiry saved and emails sent.',
      inquiryId: inquiry.id,
      adminMessageId: adminInfo?.messageId || adminInfo?.data?.id || null,
      userMessageId: userInfo?.messageId || userInfo?.data?.id || null,
      emailStatus: emailSendFailed ? 'delayed' : 'sent',
    };
    console.log('   ✅ [SEND-MAIL] Response:', responseData);
    return res.json(responseData);
  } catch (error) {
    console.error('   ❌ [CRITICAL ERROR] Inquiry processing failed:', error instanceof Error ? error.message : error);
    // Even if emails fail, the inquiry is already saved to inquiries.json
    console.log('   [INFO] Sending fallback response (inquiry saved)...');
    const fallbackResponse = {
      success: true,
      message: 'Inquiry saved successfully. Email notifications will be sent shortly.',
      inquiryId: inquiry.id,
      emailStatus: 'pending',
      note: error instanceof Error ? error.message : String(error),
    };
    console.log('   ✅ [FALLBACK] Response:', fallbackResponse);
    return res.json(fallbackResponse);
  }
});

// Inquiries read/write routes
app.get('/api/inquiries', (req, res) => {
  const status = req.query.status;
  let inquiries = readInquiries();
  if (status) {
    inquiries = inquiries.filter((inq) => inq.status === status);
  }
  res.json({ success: true, inquiries });
});

app.get('/api/admins', (req, res) => {
  const admins = ADMIN_EMAILS.map((email, index) => ({
    id: `admin_${index + 1}`,
    name: email.split('@')[0],
    email,
  }));

  res.json({ success: true, admins });
});

app.get('/api/inquiries/:id', (req, res) => {
  const inquiries = readInquiries();
  const inquiry = inquiries.find((inq) => inq.id === req.params.id);
  if (!inquiry) return res.status(404).json({ success: false, error: 'Inquiry not found' });
  res.json({ success: true, inquiry });
});

// Generate SHA256 hash for PhonePe
function generateHash(data) {
  const hashString = data + SALT_KEY;
  return crypto.createHash('sha256').update(hashString).digest('hex') + '###' + SALT_INDEX;
}

// Create payment request
app.post('/api/create-payment', async (req, res) => {
  const { amount, name, email, inquiryId } = req.body;

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
    amount: amount * 100, // Amount in paisa
    redirectUrl: `${FRONTEND_URL}/payment-success`,
    redirectMode: 'REDIRECT',
    callbackUrl: `${BACKEND_URL}/api/payment-callback`,
    mobileNumber: '9999999999', // Optional
    paymentInstrument: {
      type: 'PAY_PAGE'
    }
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const hash = generateHash(base64Payload);

  try {
    const response = await axios.post(`${PHONEPE_BASE_URL}/pg/v1/pay`, {
      request: base64Payload
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': hash
      }
    });

    res.json({
      success: true,
      paymentUrl: response.data.data.instrumentResponse.redirectInfo.url
    });
  } catch (error) {
    console.error('Payment creation failed:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Payment creation failed' });
  }
});

// Payment callback handler
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

// Catch all handler: send back React's index.html file for client-side routing
app.use(async (req, res, next) => {
  try {
    const acceptHeader = req.headers.accept || '';
    const isPageRequest = req.method === 'GET' && acceptHeader.includes('text/html');

    if (!isPageRequest) {
      return next();
    }

    if (isProduction) {
      return res.sendFile(path.join(__dirname, '../dist/index.html'));
    }

    const template = fs.readFileSync(path.resolve(frontendRoot, 'index.html'), 'utf-8');
    const html = await vite.transformIndexHtml(req.originalUrl, template);
    return res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
  } catch (error) {
    if (!isProduction && vite) {
      vite.ssrFixStacktrace(error);
    }
    next(error);
  }
});

async function start() {
  await setupFrontendMiddleware();

  if (!isProduction && vite) {
    app.use(vite.middlewares);
  }

  const PORT = process.env.PORT || (isProduction ? 5000 : 5174);
  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Backend server running on ${HOST}:${PORT}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`\n📝 Available Endpoints:`);
    console.log(`   Health Check: http://localhost:${PORT}/health`);
    console.log(`   API Health: http://localhost:${PORT}/api/health`);
    console.log(`   Debug CORS: http://localhost:${PORT}/api/debug/cors`);
    console.log(`   Debug Config: http://localhost:${PORT}/api/debug/config`);
    console.log(`   Send Mail: POST http://localhost:${PORT}/api/send-mail`);
    console.log(`   Inquiries: GET http://localhost:${PORT}/api/inquiries`);
    console.log(`   Admins: GET http://localhost:${PORT}/api/admins`);
    console.log(`\n🌍 Allowed Origins:`);
    allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
    console.log(`\n${'='.repeat(60)}\n`);
  });
}

start().catch((error) => {
  console.error('Failed to start backend server:', error);
  process.exit(1);
});