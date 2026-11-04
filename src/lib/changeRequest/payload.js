import { CR_TARGET } from '@/constants/changeRequests';
import { ITEM_FIELDS, changedItemFields, cycleChangesOf } from './itemDraft';
import { PROJECT_FIELDS, changedProjectFields } from './projectDraft';
import { newItemPayload } from './newItemDraft';

const NUMBER_KEYS = new Set([...ITEM_FIELDS, ...PROJECT_FIELDS].filter((f) => f.number).map((f) => f.key));

function asText(key, value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  return NUMBER_KEYS.has(key) ? String(Number(text)) : text;
}

/**
 * @param {{ draft: Object, subProjects: Array }} input
 * @returns {{ body: Object, fieldIndex: Array, cycleIndex: Array, newItemIndex: string[] }}
 */
export function createChangeRequestBody({ draft, subProjects }) {
  const fieldChanges = [];
  const fieldIndex = [];
  const cycleChanges = [];
  const cycleIndex = [];

  for (const change of changedProjectFields(subProjects, draft.projectEdits)) {
    fieldChanges.push({ targetTypeKey: CR_TARGET.PROJECT, targetId: '', fieldName: change.key, newValue: asText(change.key, change.to) });
    fieldIndex.push({ kind: 'project', uid: change.uid, key: change.key });
  }
  for (const item of draft.items) {
    for (const change of changedItemFields(item)) {
      fieldChanges.push({ targetTypeKey: CR_TARGET.BOQ_ITEM, targetId: String(item.itemId), fieldName: change.key, newValue: asText(change.key, change.to) });
      fieldIndex.push({ kind: 'item', itemId: item.itemId, key: change.key });
    }
    for (const change of cycleChangesOf(item)) {
      cycleChanges.push({ boqItemId: item.itemId, cycleId: change.cycleId, newPlannedDate: change.newPlannedDate });
      cycleIndex.push({ itemId: item.itemId });
    }
  }

  const newDrafts = draft.newItems ?? [];

  return {
    body: {
      reasonKeys: [...draft.reasons],
      typeKeys: [...(draft.typeKeys ?? [])],
      otherTypeText: (draft.otherTypeText ?? '').trim() || null,
      projectEffectKey: draft.projectEffectKey ?? null,
      additionalDetails: draft.details.trim() || null,
      fieldChanges,
      cycleChanges,
      newItems: newDrafts.map(newItemPayload),
    },
    fieldIndex,
    cycleIndex,
    newItemIndex: newDrafts.map((d) => d.key),
  };
}

export function mapServerErrors(errors, { fieldIndex, cycleIndex, newItemIndex = [] }) {
  const result = {
    reasons: null, typeKeys: null, otherTypeText: null, projectEffectKey: null, details: null,
    project: {}, items: {}, newItems: {}, files: null, general: [],
  };
  for (const [key, messages] of Object.entries(errors ?? {})) {
    const list = (Array.isArray(messages) ? messages : [messages]).filter(Boolean).map(String);
    if (list.length === 0) continue;
    const text = list.join(' ');
    const field = /^fieldChanges\[(\d+)\]/i.exec(key);
    const cycle = /^cycleChanges\[(\d+)\]/i.exec(key);
    const at = field ? fieldIndex[Number(field[1])] : null;
    const cycleAt = cycle ? cycleIndex[Number(cycle[1])] : null;
    const newItem = /^newItems\[(\d+)\]/i.exec(key);
    const newItemKey = newItem ? newItemIndex[Number(newItem[1])] : null;
    if (at?.kind === 'project') {
      result.project[at.uid] = { ...(result.project[at.uid] ?? {}), [at.key]: text };
    } else if (at?.kind === 'item') {
      result.items[at.itemId] = { ...(result.items[at.itemId] ?? {}), [at.key]: text };
    } else if (cycleAt) {
      const was = result.items[cycleAt.itemId]?.cycles;
      result.items[cycleAt.itemId] = { ...(result.items[cycleAt.itemId] ?? {}), cycles: was ? `${was} ${text}` : text };
    } else if (newItemKey) {
      result.newItems[newItemKey] = { ...(result.newItems[newItemKey] ?? {}), general: list };
    } else if (/^attachments/i.test(key)) {
      result.files = result.files ? `${result.files} ${text}` : text;
    } else if (/^reasonKeys/i.test(key)) {
      result.reasons = text;
    } else if (/^typeKeys/i.test(key)) {
      result.typeKeys = text;
    } else if (/^otherTypeText/i.test(key)) {
      result.otherTypeText = text;
    } else if (/^projectEffectKey/i.test(key)) {
      result.projectEffectKey = text;
    } else if (/^additionalDetails/i.test(key)) {
      result.details = text;
    } else {
      result.general.push(...list);
    }
  }
  return result;
}
