import { createWaitingTask } from '@/models/waitingTask';

const list = (value) => (Array.isArray(value) ? value : []);

export function mapChangeRequestReason(raw) {
  return {
    key: raw.key,
    label: raw.valueEN ?? '',
    labelAr: raw.valueAR ?? '',
    justification: raw.justificationEN ?? '',
    justificationAr: raw.justificationAR ?? '',
  };
}

export function mapChangeRequestType(raw) {
  return {
    key: raw.key,
    label: raw.valueEN ?? '',
    labelAr: raw.valueAR ?? '',
    requiresText: raw.requiresText === true,
  };
}

export function mapChangeRequestProjectEffect(raw) {
  return { key: raw.key, label: raw.valueEN ?? '', labelAr: raw.valueAR ?? '' };
}

export function mapChangeRequestStatus(raw) {
  return {
    key: raw.key,
    label: raw.valueEN ?? '',
    labelAr: raw.valueAR ?? '',
    colorHex: raw.colorHex ?? null,
  };
}

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

export function createChangeRequestFormData(request, files) {
  const formData = new FormData();
  formData.append('Request', requestPart(request));
  doneFiles(files).forEach((f) => formData.append('Attachments', f.file, f.name));
  return formData;
}

export function updateChangeRequestFormData(request, files) {
  const formData = new FormData();
  formData.append('Request', requestPart(request));
  doneFiles(files).forEach((f) => formData.append('AttachmentsToAdd', f.file, f.name));
  return formData;
}

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
