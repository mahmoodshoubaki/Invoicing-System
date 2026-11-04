import { CR_TARGET } from '@/constants/changeRequests';
import { itemDraftFrom } from './itemDraft';
import { applyProjectEdit } from './projectDraft';
import { newItemFrom } from './newItemDraft';

const day = (value) => (value ? String(value).slice(0, 10) : '');
const DATE_FIELDS = new Set(['expectedInvoicingDate', 'contractStartDate']);
const formText = (fieldName, value) => (DATE_FIELDS.has(fieldName) ? day(value) : value ?? '');

export function itemIdsOf(changeRequest) {
  const ids = [
    ...changeRequest.fieldChanges.filter((c) => c.targetTypeKey === CR_TARGET.BOQ_ITEM).map((c) => String(c.targetId)),
    ...changeRequest.cycleChanges.map((c) => String(c.boqItemId)),
  ];
  return [...new Set(ids)];
}

/**
 * @param {Object} changeRequest
 * @param {{ boqItems: Array, cyclesByItem: Object<string, Array>, subProjects: Array }} context
 * @returns {{ reasons: number[], typeKeys: number[], otherTypeText: string, projectEffectKey: number|null, details: string, projectEdits: Object, items: Array, newItems: Array, files: Object, }}
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
    typeKeys: (changeRequest.types ?? []).map((t) => t.key),
    otherTypeText: changeRequest.otherTypeText ?? '',
    projectEffectKey: changeRequest.projectEffect?.key ?? null,
    details: changeRequest.additionalDetails ?? '',
    projectEdits,
    items,
    newItems: (changeRequest.newItems ?? []).map((row, i) => newItemFrom(row, `new-${i + 1}`)),
    files: { existing: changeRequest.attachments ?? [], deleteIds: [], added: [] },
  };
}
