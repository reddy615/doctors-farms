const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'doctorsfarms686@gmail.com';

let transporter;
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  console.warn('SMTP configuration not found in environment variables. Mail feature is disabled.');
}

// PhonePe configuration (replace with your actual credentials)
const MERCHANT_ID = 'YOUR_MERCHANT_ID';
const SALT_KEY = 'YOUR_SALT_KEY';
const SALT_INDEX = 1;
const PHONEPE_BASE_URL = 'https://api.phonepe.com/apis/hermes'; // Use sandbox for testing

// Send mail route for contact form notifications
app.post('/api/send-mail', async (req, res) => {
  if (!transporter) {
    console.warn('Attempted email send without SMTP setup.');
    return res.status(500).json({ success: false, error: 'Mail service is not configured.' });
  }

  const { name, email, stay, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: 'Name, email and message are required.' });
  }

  const inquiry = {
    id: `INQ_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    name,
    email,
    stay: stay || 'N/A',
    message,
    status: 'unpaid',
    createdAt: new Date().toISOString(),
    payment: null,
  };

  const inquiries = readInquiries();
  inquiries.push(inquiry);
  writeInquiries(inquiries);

  const mailData = {
    from: `${name} <${email}>`,
    to: CONTACT_EMAIL,
    subject: `New booking inquiry from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nPreferred stay: ${stay || 'N/A'}\n\nMessage:\n${message}`,
    html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Preferred stay:</strong> ${stay || 'N/A'}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br/>')}</p>
      <p><strong>Inquiry ID:</strong> ${inquiry.id}</p>
    `,
  };

  if (!transporter) {
    console.warn('No transporter configured, inquiry stored but mail is disabled.');
    return res.status(500).json({ success: false, error: 'Mail service is not configured. Please configure SMTP credentials.' });
  }

  try {
    await transporter.sendMail(mailData);
    return res.json({
      success: true,
      message: 'Inquiry saved and email sent.',
      inquiryId: inquiry.id,
    });
  } catch (error) {
    console.error('Mail send failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Email send failed. Check SMTP credentials and app password.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});
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
    redirectUrl: 'http://localhost:5174/payment-success',
    redirectMode: 'REDIRECT',
    callbackUrl: 'http://localhost:3000/payment-callback',
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

app.listen(3000, () => {
  console.log('Backend server running on port 3000');
});