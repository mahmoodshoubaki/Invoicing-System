import { WARNING_DAYS } from '../constants/sla';

/**
 * @param {Date|string} date
 * @param {number} days
 * @returns {Date}
 */
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * @param {Date|string} date
 * @param {number} days
 * @returns {Date}
 */
export function subtractDays(date, days) {
  return addDays(date, -days);
}

/**
 * @param {Date|string} date1
 * @param {Date|string} date2
 * @returns {number}
 */
export function diffInDays(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diffMs = d1 - d2;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * @param {Date|string} date
 * @returns {boolean}
 */
export function isOverdue(date) {
  if (!date) return false;
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

/**
 * @param {Date|string} date
 * @param {number} warningDays
 * @returns {boolean}
 */
export function isWarning(date, warningDays = WARNING_DAYS) {
  if (!date) return false;
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = diffInDays(d, today);
  return diff >= 0 && diff <= warningDays;
}

/**
 * @param {Date|string} date
 * @returns {boolean}
 */
export function isToday(date) {
  if (!date) return false;
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

/**
 * @param {Date|string} date
 * @returns {string}
 */
export function toISODate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * @param {string} str
 * @returns {Date|null}
 */
export function fromISODate(str) {
  if (!str || typeof str !== 'string') return null;
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

/**
 * @param {Date|string} date
 * @returns {Date}
 */
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * @param {Date|string} date
 * @returns {Date}
 */
export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * @param {Date|string} date
 * @returns {string}
 */
export function formatRelativeDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const diff = diffInDays(d, new Date());
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0) return `In ${diff} day${diff !== 1 ? 's' : ''}`;
  return `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} ago`;
}

/**
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @returns {number}
 */
export function monthsBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}
