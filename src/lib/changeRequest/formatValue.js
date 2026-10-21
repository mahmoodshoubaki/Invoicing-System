/**
 * A change request's values as people read them (2026-10-19). The server sends
 * every value as text — numbers like "15", dates like "2026-12-01" — and names
 * the field; this shows money as money, a date as a date and a billing
 * frequency by its name.
 */

import { formatCurrency, formatDate } from '@/utils';

const MONEY = new Set(['projectValue', 'unitCost']);
const DATES = new Set(['expectedInvoicingDate', 'contractStartDate', 'baselineInvoicingDate']);

/**
 * @param {string} fieldName
 * @param {string|null} value
 * @param {{ currency: string, frequencies: Array<{ id, label }> }} context
 */
export function formatChangeValue(fieldName, value, { currency, frequencies }) {
  if (value == null || value === '') return '—';
  if (MONEY.has(fieldName)) return formatCurrency(Number(value) || 0, currency);
  if (DATES.has(fieldName)) return formatDate(value) || value;
  if (fieldName === 'billingFrequencyId') return frequencies.find((f) => String(f.id) === String(value))?.label ?? value;
  if (fieldName === 'contractDuration') return `${value} month${Number(value) === 1 ? '' : 's'}`;
  return value;
}
