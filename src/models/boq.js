import { createWaitingTask } from '@/models/waitingTask';

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
    // The submitter's user id, set by the backend from whoever was signed in —
    // never sent by us on insert or update.
    submittedBy:           raw.submittedBy             ?? null,
    // What screens show. Null for items created before 2026-10-01, or when the
    // user is gone.
    submittedByName:       raw.submittedByName         ?? null,
    // The to-dos its workflow is waiting on, and who holds each (2026-10-21) —
    // on every item row of GetBoqById and GetBoqByProjectCode.
    waitingOn:             (raw.waitingOn ?? []).map(createWaitingTask),
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
    // Same as on the live item.
    submittedBy:           raw.submittedBy            ?? null,
    submittedByName:       raw.submittedByName        ?? null,
  };
}

/**
 * Maps a raw API entry from GetInvoiceableBoqItemsByProjectCode — a BOQ item
 * that is currently eligible to be invoiced, with quantity availability
 * already resolved server-side (no status filtering needed on the client).
 *
 * @param {Object} raw
 * @returns {Object}
 */
export function createInvoiceableBOQItem(raw) {
  const quantity = raw.quantity ?? 0;
  const unitCost = raw.unitCost ?? 0;

  return {
    id:                raw.id,
    englishName:       raw.englishName ?? null,
    arabicName:        raw.arabicName  ?? null,
    notes:        raw.notes  ?? null,
    quantity,
    committedQuantity: raw.committedQuantity ?? 0,
    availableQuantity: raw.availableQuantity ?? quantity,
    unitCost,
    totalCost:         raw.totalCost ?? quantity * unitCost,
    billingFrequencyId: raw.billingFrequencyId ?? null,
    // The item's next upcoming tracker cycle — null when it has no tracker
    // plan at all. Lets the invoice picker show whether submitting now
    // would be on schedule, ahead, or already behind.
    trackerCycleNumber:   raw.trackerCycleNumber   ?? null,
    trackerCycleStatusId: raw.trackerCycleStatusId ?? null,
    varianceDays:         raw.varianceDays         ?? null,
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

/**
 * Maps a single raw entry from PreviewInvoicingPlan (TrackerCyclePreviewResponse)
 * into a consistent model. `isCommitted` rows already have an invoice
 * submitted against them and are read-only in the UI.
 *
 * @param {Object} raw
 * @returns {Object}
 */
export function createTrackerCycle(raw) {
  return {
    id:           raw.id ?? null,
    cycleNumber:  raw.cycleNumber ?? 0,
    totalCycles:  raw.totalCycles ?? 0,
    plannedDate:  raw.plannedDate ?? null,
    isCommitted:  raw.isCommitted ?? false,
    statusId:     raw.statusId ?? null,
    // How many days late (positive) / early (negative) the invoice against
    // this cycle was submitted; 0 = exactly on time. Only meaningful once
    // the cycle is actually invoiced — null otherwise.
    varianceDays: raw.varianceDays ?? null,
  };
}

/**
 * Builds the InsertBoqItem request body from the Add BOQ Item form plus the
 * user's current tracker cycle list. Only non-committed cycles are ever
 * sent — there's nothing to send for committed ones on create anyway, since
 * a brand-new item can't have committed cycles yet, but the filter is kept
 * here so this stays in lockstep with updateBOQItemPayload's rule.
 *
 * @param {Object} form
 * @param {Object} boq
 * @param {Array} cycles
 * @returns {Object}
 */
export function createBOQItemPayload(form, boq, cycles = []) {
  return {
    BoqId:                 boq?.id          ?? '00000000-0000-0000-0000-000000000000',
    ProjectCode:           boq?.projectCode ?? null,
    EnglishName:           form.englishName,
    ArabicName:            form.arabicName,
    Quantity:              Number(form.quantity),
    UnitCost:              Number(form.unitCost),
    ExpectedInvoicingDate: form.expectedInvoicingDate || null,
    BaselineInvoicingDate: form.baselineInvoicingDate || null,
    BillingFrequencyId:    Number(form.billingFrequencyId),
    Notes:                 form.notes || null,
    StatusId:              1,
    ContractStartDate:     form.contractStartDate  || null,
    ContractFinishDate:    form.contractFinishDate || null,
    TrackerCycles:         createTrackerCyclesPayload(cycles),
  };
}

/**
 * Builds the UpdateBoqItem request body, same idea as createBOQItemPayload
 * — committed cycles are excluded since the backend already owns them.
 *
 * @param {number} id
 * @param {Object} data
 * @param {Array} cycles
 * @returns {Object}
 */
export function updateBOQItemPayload(id, data, cycles = []) {
  return {
    ID:                    id,
    BoqId:                 data.boqId ?? null,
    EnglishName:           data.englishName,
    ArabicName:            data.arabicName,
    Quantity:              Number(data.quantity),
    UnitCost:              Number(data.unitCost),
    ExpectedInvoicingDate: data.expectedInvoicingDate || null,
    BaselineInvoicingDate: data.baselineInvoicingDate || null,
    BillingFrequencyId:    Number(data.billingFrequencyId),
    Notes:                 data.notes || null,
    StatusId:              data.statusId,
    ContractStartDate:     data.contractStartDate  || null,
    ContractFinishDate:    data.contractFinishDate || null,
    TrackerCycles:         createTrackerCyclesPayload(cycles),
  };
}

/**
 * Reduces the full (committed + non-committed) cycle list down to the
 * non-committed ones, in the shape the backend expects for TrackerCycles.
 * Committed cycles already have a real invoice against them and are
 * managed entirely by the backend — never sent back.
 *
 * @param {Array} cycles
 * @returns {Array}
 */
export function createTrackerCyclesPayload(cycles = []) {
  return cycles
    .filter((c) => !c.isCommitted)
    .map((c) => ({
      Id:          c.id ?? null,
      CycleNumber: c.cycleNumber,
      TotalCycles: c.totalCycles,
      PlannedDate: c.plannedDate,
    }));
}
