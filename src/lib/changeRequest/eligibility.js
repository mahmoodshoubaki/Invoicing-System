import { BOQ_ITEM_STATUS_ID } from '@/constants/statuses';

/**
 * @param {Object} item
 * @param {string|null} statusName
 * @param {(key: string, values?: Object) => string} t the `changeRequests.blocker` translator
 * @returns {{ reason: string, short: string }|null}
 */
export function itemBlocker(item, statusName, t) {
  if (Number(item.statusId) !== BOQ_ITEM_STATUS_ID.APPROVED) {
    const short = statusName ? statusName.toLowerCase() : t('notApproved');
    return { reason: t('onlyApproved', { status: short }), short };
  }
  if (item.hasInProgressInvoices) {
    return { reason: t('invoiceInProgress'), short: t('invoiceInProgressShort') };
  }
  return null;
}
