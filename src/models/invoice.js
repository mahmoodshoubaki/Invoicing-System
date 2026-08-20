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
    invoiceNumber:          data.invoiceNumber,
    projectCode:            data.projectCode,
    wip:                    Number(data.wip) || 0,
    revenue:                Number(data.revenue) || 0,
    submittedBy:            data.submittedBy,
    baselineCollectionDate: data.baselineCollectionDate || null,
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
    invoiceNumber:           raw.invoiceNumber ?? null,
    projectCode:             raw.projectCode   ?? null,
    vat:                     raw.vat ?? 0,
    wip:                     raw.wip ?? 0,
    revenue:                 raw.revenue ?? 0,
    submittedBy:             raw.submittedBy ?? null,
    statusId:                raw.statusId    ?? null,
    isDeleted:               raw.isDeleted ?? false,
    creationDate:            raw.creationDate            ?? null,
    submissionDate:          raw.submissionDate          ?? null,
    baselineCollectionDate:  raw.baselineCollectionDate  ?? null,
    expectedCollectionDate:  raw.expectedCollectionDate  ?? null,
    reasonsForUpdate:        raw.reasonsForUpdate  ?? null,
    workflowInstanceId:      raw.workflowInstaceId ?? null,
    totalAmount:             raw.totalAmount ?? 0,
    lines:                   (raw.lines ?? []).map(createInvoiceLine),
    attachments:             (raw.attachments ?? []).map(createInvoiceAttachment),
  };
}
