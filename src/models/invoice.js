import { createWaitingTask } from '@/models/waitingTask';
import { INVOICE_STATUS_ID } from '@/constants/statuses';

/**
 * @param {Array<{statusId: number|null, totalAmount: number}>} invoices
 * @returns {{totalInvoicesValue: number, collectedValue: number, nonCollectedValue: number}}
 */
export function summariseProjectInvoices(invoices = []) {
  return invoices.reduce((totals, invoice) => {
    const status = invoice?.statusId;
    if (status === INVOICE_STATUS_ID.REJECTED || status === INVOICE_STATUS_ID.CANCELLED) return totals;

    const amount = invoice?.totalAmount ?? 0;
    const collected = status === INVOICE_STATUS_ID.COLLECTED;

    return {
      totalInvoicesValue: totals.totalInvoicesValue + amount,
      collectedValue: totals.collectedValue + (collected ? amount : 0),
      nonCollectedValue: totals.nonCollectedValue + (collected ? 0 : amount),
    };
  }, { totalInvoicesValue: 0, collectedValue: 0, nonCollectedValue: 0 });
}

/**
 * @param {Object} raw
 * @returns {Object}
 */
export function createInvoiceLine(raw) {
  return {
    id:                      raw.id,
    invoiceId:               raw.invoiceId,
    boqItemId:               raw.boqItemId,
    quantity:                raw.quantity        ?? 0,
    billedUnitPrice:         raw.billedUnitPrice ?? 0,
    itemTitleArSnapshot:     raw.itemTitleArSnapshot     ?? null,
    itemTitleEnSnapshot:     raw.itemTitleEnSnapshot     ?? null,
    itemDescriptionSnapshot: raw.itemDescriptionSnapshot ?? null,
    lineTotal:               raw.lineTotal ?? 0,
    trackerCycleNumber:      raw.trackerCycleNumber ?? null,
    trackerCycleStatusId:    raw.trackerCycleStatusId ?? null,
    varianceDays:            raw.varianceDays ?? null,
  };
}

/**
 * @param {Object} data
 * @returns {FormData}
 */
export function createInvoiceFormData(data) {
  const request = {
    projectCode:            data.projectCode,
    wip:                   Number(data.wip) || 0,
    revenue:                Number(data.revenue) || 0,
    lines: (data.lines ?? []).map((line) => ({
      boqItemId:               line.boqItemId,
      quantity:                Number(line.quantity),
      billedUnitPrice:         Number(line.billedUnitPrice),
      itemTitleArSnapshot:     line.itemTitleArSnapshot     ?? null,
      itemTitleEnSnapshot:     line.itemTitleEnSnapshot     ?? null,
      itemDescriptionSnapshot: line.itemDescriptionSnapshot ?? null,
    })),
  };

  const formData = new FormData();
  formData.append('Request', JSON.stringify(request));
  (data.attachments ?? [])
    .filter((a) => a.status === 'done')
    .forEach((a) => formData.append('Attachments', a.file, a.name));
  return formData;
}

/**
 * @param {Object} data
 * @returns {FormData}
 */
export function createUpdateInvoiceFormData(data) {
  const request = {
    InvoiceId:              data.invoiceId,
    ReasonsForUpdate:       data.reasonsForUpdate,
    ExpectedCollectionDate:  data.expectedCollectionDate,
    FinancialClaimReference: data.financialClaimReference ?? null,
    AttachmentIdsToDelete:  data.attachmentIdsToDelete ?? [],
  };

  const formData = new FormData();
  formData.append('Request', JSON.stringify(request));
  (data.attachmentsToAdd ?? [])
    .filter((a) => a.status === 'done')
    .forEach((a) => formData.append('AttachmentsToAdd', a.file, a.name));
  return formData;
}

/**
 * @param {string} invoiceId
 * @param {Array<{file: File, name: string, status: string}>} attachments
 * @returns {FormData}
 */
export function createAddAttachmentsFormData(invoiceId, attachments) {
  const formData = new FormData();
  formData.append('InvoiceId', invoiceId);
  (attachments ?? [])
    .filter((a) => a.status === 'done')
    .forEach((a) => formData.append('Attachments', a.file, a.name));
  return formData;
}

/**
 * @param {Object} raw
 * @returns {Object}
 */
export function createInvoiceAttachment(raw) {
  return {
    id:         raw.id,
    contentId:  raw.contentId ?? null,
    invoiceId:  raw.invoiceId,
    fileName:   raw.fileName ?? null,
    fileSize:   raw.fileSize ?? 0,
    uploadedBy: raw.uploadedBy ?? null,
  };
}


/**
 * @param {Object} raw
 * @returns {Object}
 */
export function createInvoice(raw) {
  return {
    id:                      raw.id,
    invoiceNumber:           raw.invoiceNumber ?? null,
    projectCode:             raw.projectCode   ?? null,
    vat:                     raw.vat ?? 0,
    wip:                     raw.wip ?? 0,
    revenue:                 raw.revenue ?? 0,
    submittedBy:             raw.submittedBy ?? null,
    submittedByName:         raw.submittedByName ?? null,
    statusId:                raw.statusId    ?? null,
    isDeleted:               raw.isDeleted ?? false,
    creationDate:            raw.creationDate            ?? null,
    submissionDate:          raw.submissionDate          ?? null,
    baselineCollectionDate:  raw.baselineCollectionDate  ?? null,
    expectedCollectionDate:  raw.expectedCollectionDate  ?? null,
    reasonsForUpdate:        raw.reasonsForUpdate  ?? null,
    financialClaimReference: raw.financialClaimReference ?? null,
    receiptIssueDate:        raw.receiptIssueDate ?? null,
    workflowInstanceId:      raw.workflowInstanceId ?? null,
    waitingOn:               (raw.waitingOn ?? []).map(createWaitingTask),
    totalAmount:             raw.totalAmount ?? 0,
    lines:                   (raw.lines ?? []).map(createInvoiceLine),
    attachments:             (raw.attachments ?? []).map(createInvoiceAttachment),
  };
}
