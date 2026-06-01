const fs = require('fs');
const path = require('path');

const BLOCKED_DATES_FILE = path.join(__dirname, '../blocked-dates.json');
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function ensureBlockedDatesFile() {
  if (!fs.existsSync(BLOCKED_DATES_FILE)) {
    fs.writeFileSync(BLOCKED_DATES_FILE, '[]', 'utf-8');
  }
}

function normalizeDateKey(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return DATE_KEY_PATTERN.test(trimmed) ? trimmed : '';
}

function uniqueSortedDateKeys(values = []) {
  return [...new Set(values.map(normalizeDateKey).filter(Boolean))].sort();
}

function readBlockedDates() {
  try {
    ensureBlockedDatesFile();
    const raw = fs.readFileSync(BLOCKED_DATES_FILE, 'utf-8');
    const parsed = JSON.parse(raw || '[]');

    if (Array.isArray(parsed)) {
      return uniqueSortedDateKeys(parsed);
    }

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.blockedDates)) {
      return uniqueSortedDateKeys(parsed.blockedDates);
    }

    return [];
  } catch (error) {
    console.error('Error reading blocked dates file:', error);
    return [];
  }
}

function writeBlockedDates(values = []) {
  const blockedDates = uniqueSortedDateKeys(values);

  try {
    ensureBlockedDatesFile();
    fs.writeFileSync(BLOCKED_DATES_FILE, JSON.stringify(blockedDates, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing blocked dates file:', error);
  }

  return blockedDates;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateRange(startDate, endDate) {
  const start = normalizeDateKey(startDate);
  const end = normalizeDateKey(endDate);

  if (!start) return [];

  const current = new Date(`${start}T00:00:00`);
  const last = end ? new Date(`${end}T00:00:00`) : new Date(`${start}T00:00:00`);

  if (Number.isNaN(current.getTime()) || Number.isNaN(last.getTime()) || last < current) {
    return [];
  }

  const dates = [];
  while (current <= last) {
    dates.push(toDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function hasBlockedDateConflict(startDate, endDate, blockedDates = readBlockedDates()) {
  const blockedSet = new Set(uniqueSortedDateKeys(blockedDates));
  return getDateRange(startDate, endDate).some((dateKey) => blockedSet.has(dateKey));
}

module.exports = {
  readBlockedDates,
  writeBlockedDates,
  hasBlockedDateConflict,
  normalizeDateKey,
  uniqueSortedDateKeys,
};