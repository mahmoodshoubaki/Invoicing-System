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
    submissionDate:          raw.submissionDate          ?? null,
    baselineCollectionDate:  raw.baselineCollectionDate  ?? null,
    expectedCollectionDate:  raw.expectedCollectionDate  ?? null,
    workflowInstanceId:      raw.workflowInstaceId ?? null,
    totalAmount:             raw.totalAmount ?? 0,
    lines:                   (raw.lines ?? []).map(createInvoiceLine),
  };
}
