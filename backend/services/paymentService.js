const crypto = require('crypto');
const { z } = require('zod');

const webhookEventSchema = z.object({
  provider: z.enum(['stripe', 'razorpay', 'phonepe']),
  eventType: z.string().min(1),
  status: z.enum(['paid', 'failed', 'pending']),
  inquiryId: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  amount: z.number().nonnegative(),
  currency: z.string().min(1),
  rawBody: z.string().min(1),
});

function normalizeString(value, fallback = '') {
  if (value == null) return fallback;
  return String(value).trim() || fallback;
}

function safeTimingEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function detectWebhookProvider({ configuredProvider = 'auto', headers = {}, body = {} } = {}) {
  const explicitProvider = normalizeString(configuredProvider, 'auto').toLowerCase();

  if (explicitProvider !== 'auto') {
    return explicitProvider;
  }

  if (headers['stripe-signature']) return 'stripe';
  if (headers['x-razorpay-signature']) return 'razorpay';

  if (body && typeof body === 'object') {
    const payloadProvider = normalizeString(body.provider || body.gateway || body.source, '').toLowerCase();
    if (payloadProvider === 'stripe' || payloadProvider === 'razorpay') {
      return payloadProvider;
    }
  }

  return 'stripe';
}

function getWebhookSecret(provider) {
  if (provider === 'stripe') {
    return process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  if (provider === 'razorpay') {
    return process.env.RAZORPAY_WEBHOOK_SECRET || '';
  }

  if (provider === 'phonepe') {
    return process.env.PHONEPE_WEBHOOK_SECRET || process.env.PHONEPE_SALT_KEY || '';
  }

  return '';
}

function verifyStripeWebhookSignature(rawBody, signatureHeader, secret) {
  if (!secret) {
    return { verified: false, reason: 'Stripe webhook secret is missing' };
  }

  if (!signatureHeader) {
    return { verified: false, reason: 'Stripe signature header is missing' };
  }

  const parts = String(signatureHeader)
    .split(',')
    .reduce((accumulator, part) => {
      const [key, value] = part.split('=', 2);
      if (key && value) accumulator[key.trim()] = value.trim();
      return accumulator;
    }, {});

  const timestamp = parts.t;
  const signature = parts.v1;

  if (!timestamp || !signature) {
    return { verified: false, reason: 'Stripe signature payload is malformed' };
  }

  const payload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  if (!safeTimingEqual(expected, signature)) {
    return { verified: false, reason: 'Stripe signature mismatch' };
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (Number.isFinite(ageSeconds) && ageSeconds > 300) {
    return { verified: false, reason: 'Stripe webhook timestamp is outside the accepted tolerance' };
  }

  return { verified: true };
}

function verifyRazorpayWebhookSignature(rawBody, signatureHeader, secret) {
  if (!secret) {
    return { verified: false, reason: 'Razorpay webhook secret is missing' };
  }

  if (!signatureHeader) {
    return { verified: false, reason: 'Razorpay signature header is missing' };
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  if (!safeTimingEqual(expected, signatureHeader)) {
    return { verified: false, reason: 'Razorpay signature mismatch' };
  }

  return { verified: true };
}

function normalizeStripeWebhookEvent(body = {}, rawBody = '') {
  const eventType = normalizeString(body.type || body.event || 'stripe.event', 'stripe.event');
  const paymentObject = body.data?.object || {};
  const metadata = paymentObject.metadata || {};
  const inquiryId = normalizeString(
    metadata.inquiryId || metadata.bookingId || body.client_reference_id || paymentObject.client_reference_id,
    ''
  );
  const transactionId = normalizeString(
    paymentObject.payment_intent || paymentObject.id || paymentObject.latest_charge || body.id,
    ''
  );
  const amount = Number(paymentObject.amount_received ?? paymentObject.amount_total ?? paymentObject.amount ?? 0) || 0;
  const currency = normalizeString(paymentObject.currency || body.currency || 'INR', 'INR').toUpperCase();
  const lowerType = eventType.toLowerCase();

  let status = 'pending';
  if (['payment_intent.succeeded', 'checkout.session.completed', 'charge.succeeded', 'invoice.paid'].includes(lowerType)) {
    status = 'paid';
  } else if (['payment_intent.payment_failed', 'charge.failed', 'checkout.session.expired', 'payment_intent.canceled', 'invoice.payment_failed'].includes(lowerType)) {
    status = 'failed';
  }

  return {
    provider: 'stripe',
    eventType,
    status,
    inquiryId: inquiryId || null,
    transactionId: transactionId || null,
    amount,
    currency,
    rawBody,
    payload: body,
    rawStatus: normalizeString(paymentObject.status || body.status || status, status),
  };
}

function normalizeRazorpayWebhookEvent(body = {}, rawBody = '') {
  const eventType = normalizeString(body.event || body.action || 'razorpay.event', 'razorpay.event');
  const paymentEntity = body.payload?.payment?.entity || {};
  const orderEntity = body.payload?.order?.entity || {};
  const inquiryId = normalizeString(
    paymentEntity.notes?.inquiryId || paymentEntity.notes?.bookingId || orderEntity.notes?.inquiryId || body.inquiryId,
    ''
  );
  const transactionId = normalizeString(paymentEntity.id || paymentEntity.order_id || orderEntity.id || body.paymentId, '');
  const amount = Number(paymentEntity.amount || orderEntity.amount || body.amount || 0) || 0;
  const currency = normalizeString(paymentEntity.currency || orderEntity.currency || body.currency || 'INR', 'INR').toUpperCase();
  const lowerType = eventType.toLowerCase();

  let status = 'pending';
  if (['payment.captured', 'order.paid', 'payment.authorized'].includes(lowerType)) {
    status = 'paid';
  } else if (['payment.failed', 'order.failed'].includes(lowerType)) {
    status = 'failed';
  }

  return {
    provider: 'razorpay',
    eventType,
    status,
    inquiryId: inquiryId || null,
    transactionId: transactionId || null,
    amount,
    currency,
    rawBody,
    payload: body,
    rawStatus: normalizeString(paymentEntity.status || body.status || status, status),
  };
}

function normalizePhonePeCallback(body = {}, rawBody = '') {
  const eventType = normalizeString(body.event || body.type || 'phonepe.callback', 'phonepe.callback');
  const transactionId = normalizeString(
    body.merchantTransactionId || body.paymentId || body.transactionId || body.data?.merchantTransactionId,
    ''
  );
  const inquiryId = normalizeString(body.inquiryId || body.data?.inquiryId || '', '');
  const statusToken = normalizeString(body.code || body.status || body.state || body.data?.state || '', '').toUpperCase();
  const success = body.success === true || ['PAYMENT_SUCCESS', 'SUCCESS', 'COMPLETED', 'PAID', 'CAPTURED'].includes(statusToken);
  const failure = body.success === false || ['PAYMENT_FAILED', 'FAILED', 'FAILURE', 'ERROR', 'DECLINED', 'CANCELLED'].includes(statusToken);
  const status = failure ? 'failed' : success ? 'paid' : 'pending';
  const amount = Number(body.amount || body.data?.amount || 0) || 0;
  const currency = normalizeString(body.currency || body.data?.currency || 'INR', 'INR').toUpperCase();

  return {
    provider: 'phonepe',
    eventType,
    status,
    inquiryId: inquiryId || null,
    transactionId: transactionId || null,
    amount,
    currency,
    rawBody,
    payload: body,
    rawStatus: statusToken || status,
  };
}

function normalizeWebhookEvent({ provider, body = {}, rawBody = '' } = {}) {
  if (provider === 'stripe') {
    return normalizeStripeWebhookEvent(body, rawBody);
  }

  if (provider === 'razorpay') {
    return normalizeRazorpayWebhookEvent(body, rawBody);
  }

  return normalizePhonePeCallback(body, rawBody);
}

function buildConfirmationBookingData(inquiry = {}, event = {}) {
  const customerName = inquiry.customerName || inquiry.name || inquiry.fullName || 'Guest';
  const checkInDate = inquiry.checkInDate || inquiry.checkIn || '';
  const checkOutDate = inquiry.checkOutDate || inquiry.checkOut || '';
  const stay = inquiry.stay || (checkInDate && checkOutDate ? `${checkInDate} to ${checkOutDate}` : checkInDate || 'Not provided');
  const totalPrice = inquiry.totalPrice || inquiry.totalCost || inquiry.roomPrice || event.amount || 0;

  return {
    customerName,
    email: inquiry.email || '',
    phoneNumber: inquiry.phoneNumber || inquiry.phone || '',
    roomType: inquiry.roomType || 'Heritage Cottage',
    checkInDate,
    checkOutDate,
    adults: Number(inquiry.adults || 1),
    children: Number(inquiry.children || 0),
    stay,
    totalPrice,
    paymentStatus: event.status,
    bookingStatus: event.status === 'paid' ? 'confirmed' : event.status === 'failed' ? 'payment_failed' : inquiry.bookingStatus || inquiry.status || 'pending',
    paymentMethod: event.provider,
    paymentTransactionId: event.transactionId || '',
    paymentReference: event.referenceId || event.eventId || '',
  };
}

function findInquiryIndex(inquiries = [], event = {}) {
  if (!Array.isArray(inquiries) || inquiries.length === 0) {
    return -1;
  }

  if (event.inquiryId) {
    const directIndex = inquiries.findIndex((inquiry) => String(inquiry.id) === String(event.inquiryId));
    if (directIndex !== -1) {
      return directIndex;
    }
  }

  if (event.transactionId) {
    return inquiries.findIndex((inquiry) => {
      const payment = inquiry.payment || {};
      const candidates = [
        payment.merchantTransactionId,
        payment.gatewayTransactionId,
        payment.gatewayPaymentId,
        payment.paymentId,
        payment.transactionId,
        payment.stripePaymentIntentId,
        payment.razorpayPaymentId,
        payment.phonepeTransactionId,
      ].filter(Boolean);

      return candidates.some((candidate) => String(candidate) === String(event.transactionId));
    });
  }

  return -1;
}

function buildPaymentEventLog(event, inquiry = {}, overrides = {}) {
  return {
    id: `PAY_EVT_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    provider: event.provider,
    eventType: event.eventType,
    status: event.status,
    inquiryId: inquiry.id || event.inquiryId || null,
    transactionId: event.transactionId || null,
    amount: event.amount || 0,
    currency: event.currency || 'INR',
    bookingStatus: inquiry.bookingStatus || inquiry.status || null,
    source: overrides.source || 'webhook',
    receivedAt: new Date().toISOString(),
  };
}

function applyPaymentWebhookEvent(inquiries, event) {
  const schemaResult = webhookEventSchema.safeParse(event);
  if (!schemaResult.success) {
    return {
      found: false,
      validationError: schemaResult.error.flatten(),
    };
  }

  const index = findInquiryIndex(inquiries, schemaResult.data);
  if (index === -1) {
    return {
      found: false,
      reason: 'Inquiry not found for payment event',
      event: schemaResult.data,
    };
  }

  const inquiry = inquiries[index];
  const now = new Date().toISOString();
  const nextPaymentStatus = schemaResult.data.status;
  const nextBookingStatus = nextPaymentStatus === 'paid'
    ? 'confirmed'
    : nextPaymentStatus === 'failed'
      ? 'payment_failed'
      : inquiry.bookingStatus || inquiry.status || 'payment_pending';
  const eventLog = buildPaymentEventLog(schemaResult.data, inquiry);

  inquiry.paymentStatus = nextPaymentStatus;
  inquiry.bookingStatus = nextBookingStatus;
  inquiry.status = nextPaymentStatus === 'paid'
    ? 'paid'
    : nextPaymentStatus === 'failed'
      ? 'payment_failed'
      : inquiry.status || 'payment_pending';
  inquiry.lastPaymentEventAt = now;
  inquiry.payment = {
    ...(inquiry.payment || {}),
    provider: schemaResult.data.provider,
    status: nextPaymentStatus,
    eventType: schemaResult.data.eventType,
    transactionId: schemaResult.data.transactionId || inquiry.payment?.transactionId || null,
    amount: schemaResult.data.amount || inquiry.payment?.amount || inquiry.totalCost || inquiry.totalPrice || 0,
    currency: schemaResult.data.currency || inquiry.payment?.currency || 'INR',
    rawStatus: schemaResult.data.rawStatus,
    updatedAt: now,
  };
  inquiry.bookingEvents = Array.isArray(inquiry.bookingEvents) ? inquiry.bookingEvents : [];
  inquiry.bookingEvents.push(eventLog);

  return {
    found: true,
    inquiry,
    event: schemaResult.data,
    eventLog,
    shouldSendConfirmation: nextPaymentStatus === 'paid',
    bookingData: buildConfirmationBookingData(inquiry, schemaResult.data),
  };
}

module.exports = {
  applyPaymentWebhookEvent,
  buildConfirmationBookingData,
  buildPaymentEventLog,
  detectWebhookProvider,
  getWebhookSecret,
  normalizePhonePeCallback,
  normalizeWebhookEvent,
  verifyRazorpayWebhookSignature,
  verifyStripeWebhookSignature,
};