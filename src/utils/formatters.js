import { Currencies_LIST } from "@/constants";

/**
 * Format a numeric amount as a currency string.
 * Defaults to SAR (Saudi Arabian Riyal) with Arabic-Gulf locale.
 *
 * @param {number} amount
 * @param {string} currency - ISO 4217 currency code (default: 'SAR')
 * @param {string} locale  - BCP 47 locale tag (default: 'en-SA')
 * @returns {string}
 *
 * @example
 * formatCurrency(250000) // => 'SAR 250,000.00'
 * formatCurrency(75000, 'USD', 'en-US') // => '$75,000.00'
 */
export function formatCurrency(amount,currency ='USD',locale = 'en-SA') {
  const currencySymbol = Currencies_LIST.find(c => c.Key === currency)?.symbol || '';
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return `${currencySymbol}0.00`;
  }
  return `${currencySymbol}` + new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

/**
 * Format a large number with a display unit (K -> thousands, M -> millions).
 *
 * @param {number} amount
 * @returns {string}
 */
function formatDisplayUnit(amount) {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return `${amount.toLocaleString()}`;
}

/**
 * Format a Date or ISO date string as DD/MM/YYYY.
 *
 * @param {Date|string|number} date
 * @param {string} locale - BCP 47 locale tag (default: 'en-GB' to get DD/MM/YYYY)
 * @returns {string}
 *
 * @example
 * formatDate('2025-03-15') // => '15/03/2025'
 */
export function formatDate(date, locale = 'en-GB') {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a datetime value as a human-readable date and time string.
 *
 * @param {Date|string|number} date
 * @param {string} locale
 * @returns {string}
 *
 * @example
 * formatDateTime('2025-03-15T10:30:00Z') // => '15/03/2025, 10:30'
 */
export function formatDateTime(date, locale = 'en-GB') {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format a decimal value as a percentage string.
 *
 * @param {number} value - e.g. 0.15 for 15% or 15 for 15%
 * @param {number} decimalPlaces - number of decimal places (default: 1)
 * @returns {string}
 *
 * @example
 * formatPercentage(0.15) // => '15.0%'
 * formatPercentage(87.5) // => '87.5%'
 */
export function formatPercentage(value, decimalPlaces = 1) {
  if (value === null || value === undefined || isNaN(Number(value))) return '0%';
  const num = Number(value);
  // If value is given as a decimal (0–1 range), multiply by 100
  const pct = num <= 1 && num >= -1 ? num * 100 : num;
  return `${pct.toFixed(decimalPlaces)}%`;
}

/**
 * Truncate a string to a maximum length, appending an ellipsis if trimmed.
 *
 * @param {string} text
 * @param {number} maxLength
 * @param {string} ellipsis
 * @returns {string}
 *
 * @example
 * truncateText('This is a long description', 15) // => 'This is a long...'
 */
export function truncateText(text, maxLength = 50, ellipsis = '...') {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length).trimEnd() + ellipsis;
}

/**
 * Extract initials from a full name (up to 2 characters).
 *
 * @param {string} name
 * @returns {string}
 *
 * @example
 * getInitials('Ahmed Al-Rashidi') // => 'AA'
 * getInitials('Mohammed') // => 'M'
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format a large number with compact notation (K, M, B).
 *
 * @param {number} value
 * @param {string} locale
 * @returns {string}
 *
 * @example
 * formatCompactNumber(1500000) // => '1.5M'
 */
export function formatCompactNumber(value, locale = 'en-SA') {
  if (value === null || value === undefined || isNaN(Number(value))) return '0';
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(Number(value));
}

/**
 * Format a plain number with thousands separators.
 *
 * @param {number} value
 * @param {number} decimalPlaces
 * @returns {string}
 */
export function formatNumber(value, decimalPlaces = 0) {
  if (value === null || value === undefined || isNaN(Number(value))) return '0';
  return new Intl.NumberFormat('en-SA', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(Number(value));
}
