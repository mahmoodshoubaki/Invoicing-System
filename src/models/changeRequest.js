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
    affectedAreas: list(raw.affectedAreas),
  };
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
    summary: {
      affectedAreas: list(summary.affectedAreas),
      changedItemCount: summary.changedItemCount ?? 0,
      changedProjectFieldCount: summary.changedProjectFieldCount ?? 0,
      changedCycleCount: summary.changedCycleCount ?? 0,
    },
    reasons: list(raw.reasons).map((r) => ({ key: r.key, label: r.valueEN ?? '', labelAr: r.valueAR ?? '' })),
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
    waitingOn: list(raw.waitingOn).map(createWaitingTask),
  };
}
