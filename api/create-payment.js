const crypto = require('crypto');
const axios = require('axios');

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'YOUR_MERCHANT_ID';
const SALT_KEY = process.env.PHONEPE_SALT_KEY || 'YOUR_SALT_KEY';
const SALT_INDEX = 1;
const PHONEPE_BASE_URL = process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes';

function generateHash(data) {
  const hashString = data + SALT_KEY;
  return crypto.createHash('sha256').update(hashString).digest('hex') + '###' + SALT_INDEX;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, name, email } = req.body;

  const payload = {
    merchantId: MERCHANT_ID,
    merchantTransactionId: 'TXN_' + Date.now(),
    merchantUserId: 'USER_' + Date.now(),
    amount: amount * 100,
    redirectUrl: `${process.env.VERCEL_URL || 'http://localhost:3000'}/payment-success`,
    redirectMode: 'REDIRECT',
    callbackUrl: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/payment-callback`,
    mobileNumber: '9999999999',
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

    res.status(200).json({
      success: true,
      paymentUrl: response.data.data.instrumentResponse.redirectInfo.url
    });
  } catch (error) {
    console.error('Payment creation failed:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Payment creation failed' });
  }
}