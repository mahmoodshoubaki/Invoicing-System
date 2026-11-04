import { Currencies_LIST } from "@/constants";

/**
 * @param {number} amount
 * @param {string} currency
 * @param {string} locale
 * @returns {string}
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
 * @param {Date|string|number} date
 * @param {string} locale
 * @returns {string}
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
 * @param {Date|string|number} date
 * @param {string} locale
 * @returns {string}
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
 * @param {number} value
 * @param {number} decimalPlaces
 * @returns {string}
 */
export function formatPercentage(value, decimalPlaces = 1) {
  if (value === null || value === undefined || isNaN(Number(value))) return '0%';
  const num = Number(value);
  // If value is given as a decimal (0–1 range), multiply by 100
  const pct = num <= 1 && num >= -1 ? num * 100 : num;
  return `${pct.toFixed(decimalPlaces)}%`;
}

/**
 * @param {string} text
 * @param {number} maxLength
 * @param {string} ellipsis
 * @returns {string}
 */
export function truncateText(text, maxLength = 50, ellipsis = '...') {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length).trimEnd() + ellipsis;
}

/**
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * @param {number} value
 * @param {string} locale
 * @returns {string}
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
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined || isNaN(Number(bytes))) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = Number(bytes);
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
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
