const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// PhonePe configuration (replace with your actual credentials)
const MERCHANT_ID = 'YOUR_MERCHANT_ID';
const SALT_KEY = 'YOUR_SALT_KEY';
const SALT_INDEX = 1;
const PHONEPE_BASE_URL = 'https://api.phonepe.com/apis/hermes'; // Use sandbox for testing

// Generate SHA256 hash for PhonePe
function generateHash(data) {
  const hashString = data + SALT_KEY;
  return crypto.createHash('sha256').update(hashString).digest('hex') + '###' + SALT_INDEX;
}

// Create payment request
app.post('/api/create-payment', async (req, res) => {
  const { amount, name, email } = req.body;

  const payload = {
    merchantId: MERCHANT_ID,
    merchantTransactionId: 'TXN_' + Date.now(),
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
  // Verify the callback and update order status
  console.log('Payment callback received:', req.body);
  res.send('OK');
});

app.listen(3000, () => {
  console.log('Backend server running on port 3000');
});