const { sendUserConfirmation } = require('./emailService');

async function sendBookingConfirmationEmail({ bookingData, inquiryId, mailConfig, overrides = {} }) {
  return sendUserConfirmation({ bookingData, inquiryId, mailConfig, overrides });
}

module.exports = {
  sendBookingConfirmationEmail,
};