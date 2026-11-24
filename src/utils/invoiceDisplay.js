import { formatDate } from '@/utils/formatters';

export const PENDING_LABEL = 'Pending';

export function invoiceNumberOrPending(invoice, pendingLabel = PENDING_LABEL) {
  return invoice?.invoiceNumber || pendingLabel;
}

export function baselineDateOrPending(invoice, pendingLabel = PENDING_LABEL, formatDay = formatDate) {
  return invoice?.baselineCollectionDate ? formatDay(invoice.baselineCollectionDate) : pendingLabel;
}
