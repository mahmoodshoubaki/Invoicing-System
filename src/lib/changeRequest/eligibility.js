import { BOQ_STATUS } from '@/constants/statuses';

/**
 * Why an item cannot be in a change request, as the server refuses it, or null.
 *
 * @param {Object} item         createBOQItem's
 * @param {string|null} statusName
 * @returns {{ reason: string, short: string }|null}
 */
export function itemBlocker(item, statusName) {
  if (statusName !== BOQ_STATUS.APPROVED) {
    return {
      reason: `Only approved items can be changed, and this one is ${statusName ? statusName.toLowerCase() : 'not approved'}.`,
      short: statusName ? statusName.toLowerCase() : 'not approved',
    };
  }
  if (item.hasInProgressInvoices) {
    return { reason: 'It has an invoice in progress, so it can’t be in a change request.', short: 'invoice in progress' };
  }
  return null;
}
