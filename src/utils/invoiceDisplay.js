import { formatDate } from '@/utils/formatters';

export const PENDING_LABEL = 'Pending';

export function invoiceNumberOrPending(invoice) {
  return invoice?.invoiceNumber || PENDING_LABEL;
}

export function baselineDateOrPending(invoice) {
  return invoice?.baselineCollectionDate ? formatDate(invoice.baselineCollectionDate) : PENDING_LABEL;
}
