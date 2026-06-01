const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { appendPaymentEvent } = require('../services/webhookLogger');
const { sendBookingConfirmationEmail } = require('../services/emailConfirmationService');
const {
  applyPaymentWebhookEvent,
  buildPaymentEventLog,
  detectWebhookProvider,
  getWebhookSecret,
  normalizeWebhookEvent,
  verifyRazorpayWebhookSignature,
  verifyStripeWebhookSignature,
} = require('../services/paymentService');

const normalizedWebhookSchema = z.object({
  provider: z.enum(['stripe', 'razorpay', 'phonepe']),
  eventType: z.string().min(1),
  status: z.enum(['paid', 'failed', 'pending']),
  inquiryId: z.string().nullable().optional(),
  transactionId: z.string().nullable().optional(),
  amount: z.number().nonnegative(),
  currency: z.string().min(1),
  rawBody: z.string().min(1),
});

function createPaymentWebhookRouter({
  readInquiries,
  writeInquiries,
  getMailConfig,
  configuredProvider = 'auto',
  contactEmail = '',
  supportPhone = '',
}) {
  if (typeof readInquiries !== 'function' || typeof writeInquiries !== 'function' || typeof getMailConfig !== 'function') {
    throw new Error('createPaymentWebhookRouter requires readInquiries, writeInquiries, and getMailConfig');
  }

  const router = express.Router();
  const webhookLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many webhook requests. Please try again later.',
    },
  });

  router.post('/payment/webhook', webhookLimiter, async (req, res) => {
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});
    const provider = detectWebhookProvider({ configuredProvider, headers: req.headers, body: req.body });
    const secret = getWebhookSecret(provider);

    try {
      const signatureHeader = provider === 'stripe'
        ? req.headers['stripe-signature']
        : provider === 'razorpay'
          ? req.headers['x-razorpay-signature']
          : req.headers['x-phonepe-signature'];

      const verification = provider === 'stripe'
        ? verifyStripeWebhookSignature(rawBody, signatureHeader, secret)
        : provider === 'razorpay'
          ? verifyRazorpayWebhookSignature(rawBody, signatureHeader, secret)
          : { verified: true };

      if (!verification.verified) {
        appendPaymentEvent({
          provider,
          source: 'webhook',
          eventType: 'verification_failed',
          status: 'failed',
          reason: verification.reason,
          rawBody,
          receivedAt: new Date().toISOString(),
        });

        return res.status(400).json({
          success: false,
          message: 'Webhook verification failed',
        });
      }

      const normalizedEvent = normalizeWebhookEvent({ provider, body: req.body, rawBody });
      const normalizedCheck = normalizedWebhookSchema.safeParse(normalizedEvent);

      if (!normalizedCheck.success) {
        appendPaymentEvent({
          provider,
          source: 'webhook',
          eventType: 'validation_failed',
          status: 'failed',
          reason: normalizedCheck.error.flatten(),
          rawBody,
          receivedAt: new Date().toISOString(),
        });

        return res.status(400).json({
          success: false,
          message: 'Webhook verification failed',
        });
      }

      const inquiries = readInquiries();
      const result = applyPaymentWebhookEvent(inquiries, normalizedCheck.data);

      if (!result.found) {
        appendPaymentEvent({
          ...buildPaymentEventLog(normalizedCheck.data, {}, { source: 'webhook' }),
          provider,
          source: 'webhook',
          status: 'failed',
          reason: result.reason || 'Inquiry not found',
        });

        return res.status(404).json({
          success: false,
          message: 'Booking not found for payment event',
        });
      }

      writeInquiries(inquiries);
      appendPaymentEvent(result.eventLog);

      if (result.shouldSendConfirmation) {
        try {
          const mailConfig = getMailConfig();
          await sendBookingConfirmationEmail({
            bookingData: result.bookingData,
            inquiryId: result.inquiry.id,
            mailConfig,
            overrides: {
              supportEmail: contactEmail,
              supportPhone,
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

      return res.json({
        success: true,
        message: result.event.status === 'paid'
          ? 'Payment verified successfully'
          : 'Payment failure recorded',
        inquiryId: result.inquiry.id,
        paymentStatus: result.event.status,
      });
    } catch (error) {
      console.error('Payment webhook error:', error instanceof Error ? error.message : String(error));
      appendPaymentEvent({
        provider,
        source: 'webhook',
        eventType: 'processing_error',
        status: 'failed',
        reason: error instanceof Error ? error.message : String(error),
        rawBody,
        receivedAt: new Date().toISOString(),
      });

      return res.status(500).json({
        success: false,
        message: 'Webhook processing failed',
      });
    }
  });

  return router;
}

module.exports = {
  createPaymentWebhookRouter,
};