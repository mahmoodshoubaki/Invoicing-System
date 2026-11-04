/**
 * Change requests (api/BoqChangeRequests, 2026-10-19): the lookups, the list
 * row, and one request in full. Old values are the server's to read — a request
 * only ever sends new ones.
 */

import { createWaitingTask } from '@/models/waitingTask';

const list = (value) => (Array.isArray(value) ? value : []);

/** One reason, with its fixed justification, English and Arabic. */
export function mapChangeRequestReason(raw) {
  return {
    key: raw.key,
    label: raw.valueEN ?? '',
    labelAr: raw.valueAR ?? '',
    justification: raw.justificationEN ?? '',
    justificationAr: raw.justificationAR ?? '',
  };
}

/** One change request type. `requiresText` types (Other) need the requester to describe it. */
export function mapChangeRequestType(raw) {
  return {
    key: raw.key,
    label: raw.valueEN ?? '',
    labelAr: raw.valueAR ?? '',
    requiresText: raw.requiresText === true,
  };
}

/** One project effect: what a request does to the contract value. */
export function mapChangeRequestProjectEffect(raw) {
  return { key: raw.key, label: raw.valueEN ?? '', labelAr: raw.valueAR ?? '' };
}

/** One status: 1 Submitted, 2 Returned, 3 Approved, 4 Rejected, 5 Cancelled. */
export function mapChangeRequestStatus(raw) {
  return {
    key: raw.key,
    label: raw.valueEN ?? '',
    labelAr: raw.valueAR ?? '',
    colorHex: raw.colorHex ?? null,
  };
}

/** A row of a BOQ's change request list. */
export function mapChangeRequestRow(raw) {
  return {
    id: raw.id ?? raw.ID,
    number: raw.number ?? '',
    statusId: raw.statusId ?? null,
    requestedBy: raw.requestedBy ?? null,
    requestedByName: raw.requestedByName ?? null,
    createdOn: raw.createdOn ?? null,
    reasonKeys: list(raw.reasonKeys),
    typeKeys: list(raw.typeKeys),
    projectEffectKey: raw.projectEffectKey ?? null,
    affectedAreas: list(raw.affectedAreas),
  };
}

/** A file on a change request (or a BOQ). */
export function mapChangeRequestAttachment(raw) {
  return {
    id: raw?.id ?? raw?.ID ?? null,
    contentId: raw?.contentId ?? raw?.ContentId ?? null,
    fileName: raw?.fileName ?? '',
    fileSize: raw?.fileSize ?? 0,
    uploadedBy: raw?.uploadedBy ?? null,
    canRemove: raw?.canRemove === true,
  };
}

/** A new BOQ item a change request adds. `plannedDates` from the request; `trackerCycles` from a task's value. */
export function mapChangeRequestNewItem(raw) {
  const dates = list(raw?.plannedDates).length
    ? list(raw.plannedDates)
    : list(raw?.trackerCycles).map((c) => c.plannedDate);
  return {
    englishName: raw?.englishName ?? '',
    arabicName: raw?.arabicName ?? '',
    quantity: raw?.quantity ?? null,
    unitCost: raw?.unitCost ?? null,
    baselineInvoicingDate: raw?.baselineInvoicingDate ?? null,
    billingFrequencyId: raw?.billingFrequencyId ?? null,
    notes: raw?.notes ?? null,
    plannedDates: dates.filter(Boolean),
    createdBoqItemId: raw?.createdBoqItemId ?? null,
  };
}

const requestPart = (request) => JSON.stringify(request);
const doneFiles = (files) => (files ?? []).filter((f) => f.status === 'done');

/** CreateChangeRequest's multipart body: the request JSON, and the files (at least one). */
export function createChangeRequestFormData(request, files) {
  const formData = new FormData();
  formData.append('Request', requestPart(request));
  doneFiles(files).forEach((f) => formData.append('Attachments', f.file, f.name));
  return formData;
}

/** UpdateChangeRequest's multipart body. `request` carries `attachmentIdsToDelete`. */
export function updateChangeRequestFormData(request, files) {
  const formData = new FormData();
  formData.append('Request', requestPart(request));
  doneFiles(files).forEach((f) => formData.append('AttachmentsToAdd', f.file, f.name));
  return formData;
}

/** One change request, the summary first — what a reviewer reads. */
export function mapChangeRequest(raw) {
  const summary = raw.summary ?? {};
  return {
    id: raw.id ?? raw.ID,
    number: raw.number ?? '',
    boqId: raw.boqId ?? null,
    projectCode: raw.projectCode ?? null,
    statusId: raw.statusId ?? null,
    additionalDetails: raw.additionalDetails ?? null,
    requestedBy: raw.requestedBy ?? null,
    requestedByName: raw.requestedByName ?? null,
    createdOn: raw.createdOn ?? null,
    version: raw.version ?? null,
    canEdit: raw.canEdit === true,
    summary: {
      affectedAreas: list(summary.affectedAreas),
      changedItemCount: summary.changedItemCount ?? 0,
      changedProjectFieldCount: summary.changedProjectFieldCount ?? 0,
      changedCycleCount: summary.changedCycleCount ?? 0,
      newItemCount: summary.newItemCount ?? 0,
    },
    waitingOn: list(raw.waitingOn).map(createWaitingTask),
    ...mapChangeRequestContent(raw),
  };
}

/** What a change request asks for: shared by its current version and its earlier ones. */
function mapChangeRequestContent(raw) {
  return {
    reasons: list(raw.reasons).map((r) => ({ key: r.key, label: r.valueEN ?? '', labelAr: r.valueAR ?? '' })),
    types: list(raw.types).map((t) => ({ key: t.key, label: t.valueEN ?? '', labelAr: t.valueAR ?? '' })),
    otherTypeText: raw.otherTypeText ?? null,
    projectEffect: raw.projectEffect
      ? { key: raw.projectEffect.key, label: raw.projectEffect.valueEN ?? '', labelAr: raw.projectEffect.valueAR ?? '' }
      : null,
    fieldChanges: list(raw.fieldChanges).map((c) => ({
      targetTypeKey: c.targetTypeKey,
      targetId: String(c.targetId ?? ''),
      targetName: c.targetName ?? '',
      fieldName: c.fieldName,
      fieldLabel: c.fieldLabel ?? c.fieldName,
      oldValue: c.oldValue ?? null,
      newValue: c.newValue ?? null,
    })),
    cycleChanges: list(raw.cycleChanges).map((c) => ({
      boqItemId: c.boqItemId,
      boqItemName: c.boqItemName ?? '',
      cycleId: c.cycleId ?? null,
      oldPlannedDate: c.oldPlannedDate ?? null,
      newPlannedDate: c.newPlannedDate ?? null,
      changeKind: c.changeKind ?? '',
    })),
    newItems: list(raw.newItems).map(mapChangeRequestNewItem),
    attachments: list(raw.attachments).map(mapChangeRequestAttachment),
  };
}

/** One earlier version of a change request, from GetChangeRequestHistory. */
export function mapChangeRequestVersion(raw) {
  return {
    version: raw.version ?? null,
    statusId: raw.statusId ?? null,
    additionalDetails: raw.additionalDetails ?? null,
    madeBy: raw.madeBy ?? null,
    madeByName: raw.madeByName ?? null,
    madeOn: raw.madeOn ?? null,
    replacedOn: raw.replacedOn ?? null,
    ...mapChangeRequestContent(raw),
  };
}
