import { createWaitingTask } from '@/models/waitingTask';

/**
 * @typedef {Object} BOQItem
 * @property {string} id
 * @property {string|null} projectCode
 * @property {string|null} englishName
 * @property {string|null} arabicName
 * @property {string|null} notes
 * @property {number} quantity
 * @property {number} unitCost
 * @property {number} totalCost
 * @property {string|null} expectedInvoicingDate
 * @property {string|null} baselineInvoicingDate
 * @property {number|null} billingFrequencyId
 * @property {number|null} statusId
 */

/**
 * @typedef {Object} BOQ
 * @property {string} projectCode
 * @property {BOQItem[]} boqItems
 */

/**
 * @param {Object} raw
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
    submittedBy:           raw.submittedBy             ?? null,
    submittedByName:       raw.submittedByName         ?? null,
    waitingOn:             (raw.waitingOn ?? []).map(createWaitingTask),
    hasInProgressInvoices: raw.hasInProgressInvoices === true,
  };
}

/**
 * @param {Object} raw
 * @returns {BOQ}
 */
export function createBOQ(raw) {
  if (!raw) return { projectCode: null, id: null, boqItems: [], attachments: [] };
  return {
    projectCode: raw.projectCode ?? null,
    id:          raw.id          ?? null,
    boqItems:    (raw.boqItems   ?? []).map(createBOQItem),
    attachments: (raw.attachments ?? []).map(createBoqAttachment),
  };
}

export function createBoqAttachment(raw) {
  return {
    id:         raw?.id ?? raw?.ID ?? null,
    boqId:      raw?.boqId ?? null,
    contentId:  raw?.contentId ?? null,
    fileName:   raw?.fileName ?? '',
    fileSize:   raw?.fileSize ?? 0,
    uploadedBy: raw?.uploadedBy ?? null,
    canRemove:  raw?.canRemove === true,
  };
}

export function createBoqAttachmentsFormData(boqId, files) {
  const formData = new FormData();
  formData.append('BoqId', boqId);
  (files ?? []).filter((f) => f.status === 'done').forEach((f) => formData.append('Attachments', f.file, f.name));
  return formData;
}

/**
 * @param {Object} raw
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
    trackerCycleNumber:   raw.trackerCycleNumber   ?? null,
    trackerCycleStatusId: raw.trackerCycleStatusId ?? null,
    varianceDays:         raw.varianceDays         ?? null,
  };
}

/**
 * @returns {Object}
 */
export function createBOQItemForm() {
  return {
    englishName:           '',
    arabicName:            '',
    quantity:              '',
    unitCost:              '',
    totalCost:             '',
    expectedInvoicingDate: '',
    baselineInvoicingDate: '',
    billingFrequencyId:    '',
    notes:                 '',
  };
}

/**
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
    varianceDays: raw.varianceDays ?? null,
  };
}

/**
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
