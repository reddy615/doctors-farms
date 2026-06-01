const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'payment-events.jsonl');

function appendPaymentEvent(entry) {
  const record = {
    ...entry,
    recordedAt: new Date().toISOString(),
  };

  try {
    fs.appendFileSync(LOG_FILE, `${JSON.stringify(record)}\n`, 'utf-8');
    return record;
  } catch (error) {
    console.error('Failed to append payment event log:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

module.exports = {
  appendPaymentEvent,
  LOG_FILE,
};