/**
 * A returned change request back into the form (2026-10-19), so its requester
 * can change it and send it again — whole: what is left out is dropped.
 *
 * Its items are locked while it is open, so each still reads as it was when
 * the request was raised; the request's new values and cycle changes are put
 * on top of that.
 */

import { CR_TARGET } from '@/constants/changeRequests';
import { itemDraftFrom } from './itemDraft';
import { applyProjectEdit } from './projectDraft';

const day = (value) => (value ? String(value).slice(0, 10) : '');
const DATE_FIELDS = new Set(['expectedInvoicingDate', 'contractStartDate']);
const formText = (fieldName, value) => (DATE_FIELDS.has(fieldName) ? day(value) : value ?? '');

/** The ids of the items a request touches, in the order it first names them. */
export function itemIdsOf(changeRequest) {
  const ids = [
    ...changeRequest.fieldChanges.filter((c) => c.targetTypeKey === CR_TARGET.BOQ_ITEM).map((c) => String(c.targetId)),
    ...changeRequest.cycleChanges.map((c) => String(c.boqItemId)),
  ];
  return [...new Set(ids)];
}

/**
 * @param {Object} changeRequest  mapChangeRequest's
 * @param {{ boqItems: Array, cyclesByItem: Object<string, Array>, subProjects: Array }} context
 * @returns {{ reasons: number[], details: string, projectEdits: Object, items: Array }}
 */
export function draftFromChangeRequest(changeRequest, { boqItems, cyclesByItem, subProjects }) {
  let projectEdits = {};
  for (const change of changeRequest.fieldChanges.filter((c) => c.targetTypeKey === CR_TARGET.PROJECT)) {
    projectEdits = applyProjectEdit(projectEdits, subProjects, change.targetId, change.fieldName, formText(change.fieldName, change.newValue));
  }

  const items = itemIdsOf(changeRequest)
    .map((id) => {
      const item = boqItems.find((i) => String(i.id) === id);
      if (!item) return null;
      const draft = itemDraftFrom(item, cyclesByItem[id] ?? []);
      const values = { ...draft.values };
      for (const change of changeRequest.fieldChanges) {
        if (change.targetTypeKey === CR_TARGET.BOQ_ITEM && String(change.targetId) === id && change.fieldName in values) {
          values[change.fieldName] = formText(change.fieldName, change.newValue);
        }
      }
      let cycles = draft.cycles;
      for (const change of changeRequest.cycleChanges.filter((c) => String(c.boqItemId) === id)) {
        if (change.cycleId != null && !change.newPlannedDate) {
          cycles = cycles.filter((c) => c.id !== change.cycleId);
        } else if (change.cycleId != null) {
          cycles = cycles.map((c) => (c.id === change.cycleId ? { ...c, plannedDate: day(change.newPlannedDate) } : c));
        } else {
          cycles = [...cycles, {
            id: null, cycleNumber: cycles.length + 1, totalCycles: cycles.length + 1,
            plannedDate: day(change.newPlannedDate), statusId: null, isCommitted: false, varianceDays: null,
          }];
        }
      }
      return { ...draft, values, cycles };
    })
    .filter(Boolean);

  return {
    reasons: changeRequest.reasons.map((r) => r.key),
    details: changeRequest.additionalDetails ?? '',
    projectEdits,
    items,
  };
}
