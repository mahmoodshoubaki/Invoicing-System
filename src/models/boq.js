/**
 * @typedef {Object} BOQItem
 *
 * — Identity —
 * @property {string}      id                    - boqId from API
 * @property {string|null} projectCode
 *
 * — Description —
 * @property {string|null} englishName
 * @property {string|null} arabicName
 * @property {string|null} notes
 *
 * — Quantities & Costs —
 * @property {number}      quantity
 * @property {number}      unitCost
 * @property {number}      totalCost             - computed: quantity × unitCost
 *
 * — Schedule —
 * @property {string|null} expectedInvoicingDate  - ISO string
 * @property {string|null} baselineInvoicingDate  - ISO string
 * @property {number|null} billingFrequencyId
 *
 * — Status —
 * @property {number|null} statusId
 */

/**
 * @typedef {Object} BOQ
 * @property {string}      projectCode
 * @property {BOQItem[]}   boqItems
 */

/**
 * Maps a raw API BOQ item to the BOQItem model.
 * totalCost is derived here so consumers always have it without recomputing.
 *
 * @param {Object} raw - Single entry from the boqItems array in the API response
 * @returns {BOQItem}
 */
export function createBOQItem(raw) {
  const quantity = raw.quantity ?? 0;
  const unitCost = raw.unitCost ?? 0;

  return {
    id:                    raw.id,
    boqId:                 raw.boqId,
    projectCode:           raw.projectCode             ?? null,
    englishName:           raw.englishName             ?? null,
    arabicName:            raw.arabicName              ?? null,
    notes:                 raw.notes                   ?? null,
    quantity,
    unitCost,
    totalCost:             quantity * unitCost,
    expectedInvoicingDate: raw.expectedInvoicingDate   ?? null,
    baselineInvoicingDate: raw.baselineInvoicingDate   ?? null,
    billingFrequencyId:    raw.billingFrequencyId      ?? null,
    statusId:              raw.statusId                ?? null,
  };
}

/**
 * Maps the outer API response to a BOQ model, mapping each item through createBOQItem.
 *
 * @param {Object} raw - Root API response: { projectCode, boqItems: [...] }
 * @returns {BOQ}
 */
export function createBOQ(raw) {
  if (!raw) return { projectCode: null, id: null, boqItems: [] };
  return {
    projectCode: raw.projectCode ?? null,
    id:          raw.id          ?? null,
    boqItems:    (raw.boqItems   ?? []).map(createBOQItem),
  };
}

/**
 * Maps a raw API BOQ item history entry (a past revision of a BOQ item) to a
 * consistent model, mirroring createBOQItem plus the fields unique to history.
 *
 * @param {Object} raw - Single entry from the GetBoqItemHistory response
 * @returns {Object}
 */
export function createBOQItemHistoryEntry(raw) {
  const quantity = raw.quantity ?? 0;
  const unitCost = raw.unitCost ?? 0;

  return {
    id:                    raw.id,
    boqItemId:             raw.boqItemId,
    englishName:           raw.englishName           ?? null,
    arabicName:            raw.arabicName            ?? null,
    notes:                 raw.notes                 ?? null,
    quantity,
    unitCost,
    totalCost:             quantity * unitCost,
    expectedInvoicingDate: raw.expectedInvoicingDate  ?? null,
    baselineInvoicingDate: raw.baselineInvoicingDate  ?? null,
    billingFrequencyId:    raw.billingFrequencyId     ?? null,
    statusId:              raw.statusId               ?? null,
    isDeleted:             raw.isDeleted              ?? false,
    updatedOn:             raw.updatedOn              ?? false,
  };
}

/**
 * Returns the default empty form state for a new BOQ item.
 * Import this wherever a "new item" form is initialised — the shape here
 * is the single source of truth for which fields the form owns.
 *
 * @returns {Object}
 */
export function createBOQItemForm() {
  return {
    englishName:           '',
    arabicName:            '',
    quantity:              '',
    unitCost:              '',
    totalCost:             '',   // derived display-only field, not sent to API
    expectedInvoicingDate: '',
    baselineInvoicingDate: '',
    billingFrequencyId:    '',
    notes:                 '',
  };
}
