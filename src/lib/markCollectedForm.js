import { INVOICE_STATUS_ID } from '@/constants/statuses';
import { formatDate } from '@/utils/formatters';

const day = (value) => (value ? String(value).slice(0, 10) : null);

/**
 * @param {Date} [date]
 * @returns {string} yyyy-MM-dd in the browser's own time zone.
 */
export function localDay(date = new Date()) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/**
 * @param {{ statusId?: number|null }|null} invoice
 */
export function isPartiallyCollected(invoice) {
  return invoice?.statusId === INVOICE_STATUS_ID.PARTIALLY_COLLECTED;
}

/**
 * @param {Array<{ collectedDate: string|null }>} [payments]
 * @returns {string|null}
 */
export function lastPaymentDay(payments = []) {
  return payments.reduce((newest, payment) => {
    const current = day(payment?.collectedDate);
    return current && (!newest || current > newest) ? current : newest;
  }, null);
}

/**
 * @returns {{ min: string|null, max: string }}
 */
export function markCollectedLimits(invoice, today) {
  return { min: lastPaymentDay(invoice?.payments ?? []), max: today };
}

/**
 * @returns {{ collectedAmount: string, collectedDate: string }}
 */
export function markCollectedDefaults(invoice, today) {
  return {
    collectedAmount: invoice?.totalAmount != null ? String(invoice.totalAmount) : '',
    collectedDate: today,
  };
}

/**
 * @returns {{ collectedAmount?: string, collectedDate?: string }}
 */
export function markCollectedProblems({ collectedAmount, collectedDate }, { min, max }, t, formatDay = formatDate) {
  const problems = {};
  const amount = Number(collectedAmount);
  if (collectedAmount === '' || collectedAmount == null || !Number.isFinite(amount) || amount <= 0) {
    problems.collectedAmount = t('errors.amount');
  }
  if (!collectedDate) problems.collectedDate = t('errors.date');
  else if (max && collectedDate > max) problems.collectedDate = t('errors.future');
  else if (min && collectedDate < min) {
    problems.collectedDate = t('errors.beforeLast', { date: formatDay(min) });
  }
  return problems;
}

/**
 * @returns {{ invoiceId: string, collectedDate: string|null, collectedAmount: number }}
 */
export function markCollectedBody(invoiceId, { collectedAmount, collectedDate }) {
  return { invoiceId, collectedDate: day(collectedDate), collectedAmount: Number(collectedAmount) };
}
