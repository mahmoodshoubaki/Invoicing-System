import { formatCurrency, formatDate } from '@/utils';

const MONEY = new Set(['projectValue', 'unitCost']);
const DATES = new Set(['expectedInvoicingDate', 'contractStartDate', 'baselineInvoicingDate']);

/**
 * @param {string} fieldName
 * @param {string|null} value
 * @param {{ currency: string, frequencies: Array<{ id, label }>, formatDay?: (value) => string, frequencyLabel?: (label: string) => string, monthsLabel: (count: number) => string }} context
 */
export function formatChangeValue(fieldName, value, { currency, frequencies, formatDay = formatDate, frequencyLabel = (label) => label, monthsLabel }) {
  if (value == null || value === '') return '—';
  if (MONEY.has(fieldName)) return formatCurrency(Number(value) || 0, currency);
  if (DATES.has(fieldName)) return formatDay(value) || value;
  if (fieldName === 'billingFrequencyId') {
    const label = frequencies.find((f) => String(f.id) === String(value))?.label;
    return label ? frequencyLabel(label) : value;
  }
  if (fieldName === 'contractDuration') return monthsLabel(Number(value));
  return value;
}
