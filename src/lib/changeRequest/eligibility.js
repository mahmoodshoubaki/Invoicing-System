/**
 * Which BOQ items a change request may hold (2026-10-18). Only approved items
 * can be changed, and an item that has an invoice cannot be in a request at
 * all. New items are never part of one — they are added the usual way once
 * the request is approved.
 *
 * Whether an item has an invoice is read off its invoicing plan: a cycle that
 * has been invoiced is marked `isCommitted`. Items frozen by another request
 * are the server's to refuse — the form cannot see other requests yet.
 */

import { BOQ_STATUS } from '@/constants/statuses';

/** Why an item cannot be picked from its status alone, or null. */
export function statusBlocker(item, statusName) {
  return statusName === BOQ_STATUS.APPROVED ? null : 'Only approved items can be changed.';
}

/** Why an item cannot be in a request once its plan is known, or null. */
export function invoicedBlocker(cycles) {
  return (cycles ?? []).some((c) => c.isCommitted)
    ? 'It has an invoice, so it can’t be in a change request.'
    : null;
}
