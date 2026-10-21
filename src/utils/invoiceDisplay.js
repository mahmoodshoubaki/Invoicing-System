/**
 * How an invoice's stage-2 values read before they exist (2026-10-11).
 *
 * An invoice is created without its number or its baseline collection date;
 * whoever holds the workflow's task fills them in later. Until then every
 * screen says "Pending" — the same word everywhere, so nobody reads a blank as
 * a lost value.
 */

import { formatDate } from '@/utils/formatters';

export const PENDING_LABEL = 'Pending';

/** The invoice's number, or "Pending". */
export function invoiceNumberOrPending(invoice) {
  return invoice?.invoiceNumber || PENDING_LABEL;
}

/** The baseline collection date, formatted, or "Pending". */
export function baselineDateOrPending(invoice) {
  return invoice?.baselineCollectionDate ? formatDate(invoice.baselineCollectionDate) : PENDING_LABEL;
}
