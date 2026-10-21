/**
 * A change request as the API takes it (2026-10-19) — only what changes, as
 * text, never an old value (the server reads those):
 *
 *   fieldChanges  { targetTypeKey: 3, targetId: "<item id>", fieldName, newValue }
 *                 { targetTypeKey: 4, targetId: "<projectUID>", fieldName, newValue }
 *   cycleChanges  { boqItemId, cycleId, newPlannedDate } — no cycleId adds a
 *                 cycle, no date removes one, both move one
 *
 * Numbers go as "15", dates as "2026-12-01". The same body raises a request and
 * (with its id) sends a returned one again — whole.
 *
 * Alongside the body come the indexes that tie a refusal's `fieldChanges[i]` /
 * `cycleChanges[i]` back to the box it is about.
 */

import { CR_TARGET } from '@/constants/changeRequests';
import { ITEM_FIELDS, changedItemFields, cycleChangesOf } from './itemDraft';
import { PROJECT_FIELDS, changedProjectFields } from './projectDraft';

const NUMBER_KEYS = new Set([...ITEM_FIELDS, ...PROJECT_FIELDS].filter((f) => f.number).map((f) => f.key));

function asText(key, value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  return NUMBER_KEYS.has(key) ? String(Number(text)) : text;
}

/**
 * @param {{ draft: Object, subProjects: Array }} input  the draft, and the sub-projects as loaded
 * @returns {{ body: Object, fieldIndex: Array, cycleIndex: Array }}
 */
export function createChangeRequestBody({ draft, subProjects }) {
  const fieldChanges = [];
  const fieldIndex = [];
  const cycleChanges = [];
  const cycleIndex = [];

  for (const change of changedProjectFields(subProjects, draft.projectEdits)) {
    fieldChanges.push({ targetTypeKey: CR_TARGET.PROJECT, targetId: change.uid, fieldName: change.key, newValue: asText(change.key, change.to) });
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

  return {
    body: {
      reasonKeys: [...draft.reasons],
      additionalDetails: draft.details.trim() || null,
      fieldChanges,
      cycleChanges,
    },
    fieldIndex,
    cycleIndex,
  };
}

/**
 * A refusal's `errors` (BOQ-016), put back where they belong: `fieldChanges[i]`
 * under that field's box, `cycleChanges[i]` under that item's plan,
 * `reasonKeys` under the reasons, `additionalDetails` under the details, and
 * `changes` (or anything else) on the request as a whole — each of those
 * messages kept apart (2026-10-21), so they can be grouped and read one by
 * one rather than as one run-on paragraph.
 */
export function mapServerErrors(errors, { fieldIndex, cycleIndex }) {
  const result = { reasons: null, details: null, project: {}, items: {}, general: [] };
  for (const [key, messages] of Object.entries(errors ?? {})) {
    const list = (Array.isArray(messages) ? messages : [messages]).filter(Boolean).map(String);
    if (list.length === 0) continue;
    const text = list.join(' ');
    const field = /^fieldChanges\[(\d+)\]/i.exec(key);
    const cycle = /^cycleChanges\[(\d+)\]/i.exec(key);
    const at = field ? fieldIndex[Number(field[1])] : null;
    const cycleAt = cycle ? cycleIndex[Number(cycle[1])] : null;
    if (at?.kind === 'project') {
      result.project[at.uid] = { ...(result.project[at.uid] ?? {}), [at.key]: text };
    } else if (at?.kind === 'item') {
      result.items[at.itemId] = { ...(result.items[at.itemId] ?? {}), [at.key]: text };
    } else if (cycleAt) {
      const was = result.items[cycleAt.itemId]?.cycles;
      result.items[cycleAt.itemId] = { ...(result.items[cycleAt.itemId] ?? {}), cycles: was ? `${was} ${text}` : text };
    } else if (/^reasonKeys/i.test(key)) {
      result.reasons = text;
    } else if (/^additionalDetails/i.test(key)) {
      result.details = text;
    } else {
      result.general.push(...list);
    }
  }
  return result;
}
