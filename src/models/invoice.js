import { createWaitingTask } from '@/models/waitingTask';
import { INVOICE_STATUS_ID } from '@/constants/statuses';

/**
 * The money a project's invoices add up to, in the three figures the project
 * page reports.
 *
 * Rejected and cancelled invoices are not money: nobody will ever pay them, so
 * they count towards nothing here — not the total raised, and not what is still
 * outstanding. Everything else that is not yet collected is outstanding,
 * whatever stage it has reached.
 *
 *   totalInvoicesValue = collectedValue + nonCollectedValue
 *
 * Amounts are `totalAmount`, the invoice's own total, which is what the
 * Invoices tab shows per row.
 *
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
 * Maps a raw invoice line from the API into a consistent model.
 * Skips the nested `invoice` back-reference each line carries — it's a
 * duplicate of the parent invoice and never needed client-side.
 *
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
    // null when this line's BOQ item has no tracker plan, or no cycle was
    // associated with this invoice line — not every line necessarily maps
    // to a tracker cycle.
    trackerCycleNumber:      raw.trackerCycleNumber ?? null,
    trackerCycleStatusId:    raw.trackerCycleStatusId ?? null,
    varianceDays:            raw.varianceDays ?? null,
  };
}

/**
 * Builds the CreateInvoice request as multipart/form-data: the non-file
 * fields go in as a single JSON string under the "request" field, and each
 * attachment is appended as its own "attachments" file part — the backend's
 * IFormFile binding reads filename/content-type/size directly off each
 * part's own headers, so none of that is duplicated as separate fields.
 * `data.attachments` is expected in the shape AttachmentUploader produces:
 * `{file, name, size, type}` per entry.
 *
 * @param {Object} data
 * @returns {FormData}
 */
export function createInvoiceFormData(data) {
  const request = {
    // No invoice number or baseline collection date (2026-10-11): those are
    // filled in at stage 2, by whoever holds the workflow's task for them.
    projectCode:            data.projectCode,
    // A 12-digit number, or null for none (2026-10-13).
    financialClaimReference: data.financialClaimReference ?? null,
    wip:                    Number(data.wip) || 0,
    revenue:                Number(data.revenue) || 0,
    // No `submittedBy`: the backend sets it from the signed-in user.
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
 * Builds the UpdateInvoice request as multipart/form-data. Mirrors
 * createInvoiceFormData's shape (a JSON "Request" field plus file parts)
 * but is otherwise a separate, narrower request: UpdateInvoice only ever
 * touches ReasonsForUpdate, ExpectedCollectionDate, which existing
 * attachments to delete, and which new ones to add — every other invoice
 * field is read-only once created. New attachments go under their own
 * "AttachmentIdsToAdd" file field (kept distinct from Create's
 * "Attachments" field per spec), read the same way off each part's own
 * headers. `data.attachmentsToAdd` is expected in the shape
 * AttachmentUploader produces: `{file, name, size, type}` per entry.
 *
 * @param {Object} data
 * @returns {FormData}
 */
export function createUpdateInvoiceFormData(data) {
  const request = {
    InvoiceId:              data.invoiceId,
    ReasonsForUpdate:       data.reasonsForUpdate,
    ExpectedCollectionDate:  data.expectedCollectionDate,
    // Sent as it should be AFTER the edit (2026-10-13): null or missing CLEARS
    // it, so an unchanged one is sent as it was.
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
 * Builds the AddInvoiceAttachments request (2026-10-11): plain form fields —
 * `InvoiceId`, and one `Attachments` file part per file — with no JSON
 * "Request" part, because the endpoint binds the form directly.
 *
 * @param {string} invoiceId
 * @param {Array<{file: File, name: string, status: string}>} attachments  AttachmentUploader's entries
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
 * Maps a raw invoice attachment from the API into a consistent model.
 * `contentId` identifies the stored file content and is what
 * DownloadInvoiceAttachment expects as its AttachmentId param — `id` is the
 * attachment record's own identity (used for AttachmentIdsToDelete), not
 * interchangeable with contentId.
 *
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
 * Maps a raw API invoice to a consistent model.
 *
 * @param {Object} raw
 * @returns {Object}
 */
export function createInvoice(raw) {
  return {
    id:                      raw.id,
    // Null until stage 2 fills it in (2026-10-11) — screens show "Pending".
    invoiceNumber:           raw.invoiceNumber ?? null,
    projectCode:             raw.projectCode   ?? null,
    vat:                     raw.vat ?? 0,
    wip:                     raw.wip ?? 0,
    revenue:                 raw.revenue ?? 0,
    // The submitter's user id, set by the backend from whoever was signed in.
    submittedBy:             raw.submittedBy ?? null,
    // What screens show. "Unknown" when the user is gone (null in the
    // project list).
    submittedByName:         raw.submittedByName ?? null,
    statusId:                raw.statusId    ?? null,
    isDeleted:               raw.isDeleted ?? false,
    creationDate:            raw.creationDate            ?? null,
    submissionDate:          raw.submissionDate          ?? null,
    // Also null until stage 2.
    baselineCollectionDate:  raw.baselineCollectionDate  ?? null,
    expectedCollectionDate:  raw.expectedCollectionDate  ?? null,
    reasonsForUpdate:        raw.reasonsForUpdate  ?? null,
    // A 12-digit number or null (2026-10-13). Typed on the forms, or filled in
    // by a workflow task.
    financialClaimReference: raw.financialClaimReference ?? null,
    workflowInstanceId:      raw.workflowInstanceId ?? null,
    // The to-dos its workflow is waiting on, and who holds each — shown to
    // anyone who can see the invoice. Only GetInvoiceById carries it.
    waitingOn:               (raw.waitingOn ?? []).map(createWaitingTask),
    totalAmount:             raw.totalAmount ?? 0,
    lines:                   (raw.lines ?? []).map(createInvoiceLine),
    attachments:             (raw.attachments ?? []).map(createInvoiceAttachment),
  };
}
