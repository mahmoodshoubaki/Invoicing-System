/**
 * A change request's content asked for by a workflow task (2026-10-20) — the
 * request back with its requester, or an approver adjusting it. Four fields,
 * any of them:
 *
 *   reasonKeys         [1, 5]
 *   additionalDetails  text
 *   fieldChanges       [{ targetTypeKey, targetId, fieldName, oldValue, newValue }]
 *   cycleChanges       [{ boqItemId, cycleId, oldPlannedDate, newPlannedDate }]
 *
 * The lists come as JSON text. The form is the create form, filled from them;
 * what goes back is the create request's shape (old values are ignored, so
 * none are sent). A list sent replaces the request's whole list, so every row
 * goes, changed or not; a field the task does not ask for keeps what the
 * request has — so a part not asked for is shown locked, and never sent.
 */

import { CR_TARGET } from '@/constants/changeRequests';
import { CR_CYCLE_CHANGES_TYPE, CR_FIELD_CHANGES_TYPE, CR_REASONS_TYPE, TARGET_TYPE } from '@/constants/workflow';
import { ITEM_FIELDS, changedItemFields, planChanged } from './itemDraft';
import { PROJECT_FIELDS } from './projectDraft';
import { createChangeRequestBody, mapServerErrors } from './payload';

export const CR_DETAILS_FIELD = 'additionalDetails';

/**
 * Which of the request's parts a task asks for — each the task's field, or
 * null. The details are a plain text field, so they count only on a task
 * about a change request.
 *
 * @param {Object} task  a GetMyTasks row
 */
export function changeRequestTaskParts(task) {
  const fields = task?.fields ?? [];
  const ofType = (typeKey) => fields.find((f) => f.typeKey === typeKey) ?? null;
  const onRequest = task?.targetTypeKey === TARGET_TYPE.BOQ_CHANGE_REQUEST;
  return {
    reasons: ofType(CR_REASONS_TYPE),
    details: onRequest ? fields.find((f) => f.name === CR_DETAILS_FIELD) ?? null : null,
    fieldChanges: ofType(CR_FIELD_CHANGES_TYPE),
    cycleChanges: ofType(CR_CYCLE_CHANGES_TYPE),
  };
}

/** Whether a task asks for any of a change request's parts. */
export const asksForChangeRequest = (parts) => Object.values(parts).some(Boolean);

/** Whether it asks for the request's changes — and so needs the BOQ to draw them. */
export const asksForChanges = (parts) => Boolean(parts.fieldChanges || parts.cycleChanges);

/** The names of the task's fields the request's editor draws and sends. */
export const changeRequestFieldNames = (parts) => new Set(Object.values(parts).filter(Boolean).map((f) => f.name));

/** What the form's hook is told to ask for — see problemsAskedFor. */
export function partsAsked(parts) {
  return {
    reasons: Boolean(parts.reasons),
    details: Boolean(parts.details),
    detailsRequired: parts.details?.required === true,
    fieldChanges: Boolean(parts.fieldChanges),
    cycleChanges: Boolean(parts.cycleChanges),
  };
}

/** A JSON list from a task's value; empty for none, null when the text is not a list. */
export function parseList(text) {
  if (text == null || String(text).trim() === '') return [];
  try {
    const raw = JSON.parse(text);
    return Array.isArray(raw) ? raw : null;
  } catch {
    return null;
  }
}

const fieldRow = (r) => ({
  targetTypeKey: Number(r?.targetTypeKey),
  targetId: String(r?.targetId ?? ''),
  fieldName: r?.fieldName ?? '',
  oldValue: r?.oldValue ?? null,
  newValue: r?.newValue ?? null,
});

const cycleRow = (r) => ({
  boqItemId: Number(r?.boqItemId),
  cycleId: r?.cycleId ?? null,
  oldPlannedDate: r?.oldPlannedDate ?? null,
  newPlannedDate: r?.newPlannedDate ?? null,
});

/**
 * The request as the task has it — the task's own values for the parts it
 * asks for, the request as loaded for the rest — in the shape
 * draftFromChangeRequest reads. The labels of the parts whose text is not a
 * list are returned in `unreadable`: nothing is drawn (or sent) from them.
 *
 * @param {ReturnType<typeof changeRequestTaskParts>} parts
 * @param {Object|null} changeRequest  mapChangeRequest's, when it could be loaded
 * @returns {{ changeRequest: Object, unreadable: string[] }}
 */
export function changeRequestFromTask(parts, changeRequest) {
  const base = changeRequest ?? { reasons: [], additionalDetails: null, fieldChanges: [], cycleChanges: [] };
  const unreadable = [];
  const read = (field) => {
    if (!field) return null;
    const rows = parseList(field.value);
    if (rows === null) unreadable.push(field.label || field.name);
    return rows;
  };
  const reasonKeys = read(parts.reasons);
  const fieldRows = read(parts.fieldChanges);
  const cycleRows = read(parts.cycleChanges);
  return {
    changeRequest: {
      reasons: reasonKeys ? reasonKeys.map((key) => ({ key: Number(key) })) : base.reasons,
      additionalDetails: parts.details ? parts.details.value ?? null : base.additionalDetails,
      fieldChanges: fieldRows ? fieldRows.map(fieldRow) : base.fieldChanges,
      cycleChanges: cycleRows ? cycleRows.map(cycleRow) : base.cycleChanges,
    },
    unreadable,
  };
}

/**
 * The rows the form cannot draw — an item no longer on the BOQ, a sub-project
 * EPM no longer lists, a field the form does not know. They go back as they
 * are, so answering the task never drops one.
 *
 * @param {{ fieldChanges: Array, cycleChanges: Array }} changeRequest
 * @param {{ boqItems: Array, subProjects: Array }} context  the BOQ's items, and subProjectOriginals'
 */
export function rowsKeptAsIs(changeRequest, { boqItems, subProjects }) {
  const itemIds = new Set(boqItems.map((i) => String(i.id)));
  const uids = new Set(subProjects.map((p) => p.uid));
  const itemKeys = new Set(ITEM_FIELDS.map((f) => f.key));
  const projectKeys = new Set(PROJECT_FIELDS.map((f) => f.key));
  const drawn = (c) => (c.targetTypeKey === CR_TARGET.BOQ_ITEM && itemIds.has(String(c.targetId)) && itemKeys.has(c.fieldName))
    || (c.targetTypeKey === CR_TARGET.PROJECT && uids.has(c.targetId) && projectKeys.has(c.fieldName));
  return {
    fieldChanges: changeRequest.fieldChanges
      .filter((c) => !drawn(c))
      .map(({ targetTypeKey, targetId, fieldName, newValue }) => ({ targetTypeKey, targetId, fieldName, newValue })),
    cycleChanges: changeRequest.cycleChanges
      .filter((c) => !itemIds.has(String(c.boqItemId)))
      .map(({ boqItemId, cycleId, newPlannedDate }) => ({ boqItemId, cycleId, newPlannedDate })),
  };
}

const NOTHING_KEPT = { fieldChanges: [], cycleChanges: [] };

/**
 * What the task sends for the parts it asks for — the create request's shape,
 * each as text — and the indexes that tie a refusal's `fieldChanges[i]` back
 * to its box. A list part not asked for is not sent; a refusal about it is
 * about the request's own rows, in its own order, so it is said whole.
 *
 * @param {ReturnType<typeof changeRequestTaskParts>} parts
 * @param {Object} draft  the form's
 * @param {{ subProjects: Array, kept?: ReturnType<typeof rowsKeptAsIs> }} context
 */
export function changeRequestTaskValues(parts, draft, { subProjects, kept = NOTHING_KEPT }) {
  const { body, fieldIndex, cycleIndex } = createChangeRequestBody({ draft, subProjects });
  const values = {};
  if (parts.reasons) values[parts.reasons.name] = JSON.stringify(body.reasonKeys);
  if (parts.details) values[parts.details.name] = body.additionalDetails;
  if (parts.fieldChanges) values[parts.fieldChanges.name] = JSON.stringify([...body.fieldChanges, ...kept.fieldChanges]);
  if (parts.cycleChanges) values[parts.cycleChanges.name] = JSON.stringify([...body.cycleChanges, ...kept.cycleChanges]);
  return {
    values,
    fieldIndex: parts.fieldChanges ? fieldIndex : [],
    cycleIndex: parts.cycleChanges ? cycleIndex : [],
  };
}

const REQUEST_KEY = /^(fieldChanges|cycleChanges|reasonKeys|additionalDetails|changes)\b/i;

/**
 * A refusal's errors split (2026-10-20): the request's own — its keys are the
 * create request's, like `fieldChanges[2]` — put where the create form puts
 * them, and the rest left for the task's other fields. A `Values.` wrapping is
 * taken off either way.
 *
 * @returns {{ placed: ReturnType<typeof mapServerErrors>, rest: Object }}
 */
export function splitChangeRequestErrors(errors, { fieldIndex, cycleIndex }) {
  const mine = {};
  const rest = {};
  for (const [rawKey, messages] of Object.entries(errors ?? {})) {
    const key = String(rawKey).replace(/^values\./i, '');
    if (REQUEST_KEY.test(key)) mine[key] = messages;
    else rest[rawKey] = messages;
  }
  return { placed: mapServerErrors(mine, { fieldIndex, cycleIndex }), rest };
}

/**
 * Whether an item can be taken out of the request by a task: only when the
 * task may change everything the item changes — taking it out drops its field
 * changes and its plan changes both.
 */
export function canTakeOut(item, asks) {
  if (!asks.fieldChanges && changedItemFields(item).length > 0) return false;
  if (!asks.cycleChanges && planChanged(item)) return false;
  return true;
}
