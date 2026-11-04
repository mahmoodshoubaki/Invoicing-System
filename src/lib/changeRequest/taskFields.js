import { CR_TARGET } from '@/constants/changeRequests';
import {
  CR_CYCLE_CHANGES_TYPE, CR_FIELD_CHANGES_TYPE, CR_NEW_ITEMS_TYPE, CR_REASONS_TYPE, CR_TYPES_TYPE, TARGET_TYPE,
} from '@/constants/workflow';
import { mapChangeRequestNewItem } from '@/models/changeRequest';
import { ITEM_FIELDS, changedItemFields, planChanged } from './itemDraft';
import { PROJECT_FIELDS } from './projectDraft';
import { createChangeRequestBody, mapServerErrors } from './payload';

export const CR_DETAILS_FIELD = 'additionalDetails';
export const CR_OTHER_TYPE_FIELD = 'otherTypeText';
export const CR_EFFECT_FIELD = 'projectEffectKey';

/**
 * @param {Object} task
 */
export function changeRequestTaskParts(task) {
  const fields = task?.fields ?? [];
  const ofType = (typeKey) => fields.find((f) => f.typeKey === typeKey) ?? null;
  const onRequest = task?.targetTypeKey === TARGET_TYPE.BOQ_CHANGE_REQUEST;
  const named = (name) => (onRequest ? fields.find((f) => f.name === name) ?? null : null);
  return {
    reasons: ofType(CR_REASONS_TYPE),
    types: ofType(CR_TYPES_TYPE),
    otherType: named(CR_OTHER_TYPE_FIELD),
    effect: named(CR_EFFECT_FIELD),
    details: named(CR_DETAILS_FIELD),
    fieldChanges: ofType(CR_FIELD_CHANGES_TYPE),
    cycleChanges: ofType(CR_CYCLE_CHANGES_TYPE),
    newItems: ofType(CR_NEW_ITEMS_TYPE),
  };
}

export const asksForChangeRequest = (parts) => Object.values(parts).some(Boolean);

export const asksForChanges = (parts) => Boolean(parts.fieldChanges || parts.cycleChanges || parts.newItems);

export const changeRequestFieldNames = (parts) => new Set(Object.values(parts).filter(Boolean).map((f) => f.name));

export function partsAsked(parts) {
  return {
    reasons: Boolean(parts.reasons),
    types: Boolean(parts.types),
    typeText: Boolean(parts.otherType),
    effect: Boolean(parts.effect),
    details: Boolean(parts.details),
    detailsRequired: parts.details?.required === true,
    fieldChanges: Boolean(parts.fieldChanges),
    cycleChanges: Boolean(parts.cycleChanges),
    newItems: Boolean(parts.newItems),
    files: false,
  };
}

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
 * @param {ReturnType<typeof changeRequestTaskParts>} parts
 * @param {Object|null} changeRequest
 * @returns {{ changeRequest: Object, unreadable: string[] }}
 */
export function changeRequestFromTask(parts, changeRequest) {
  const base = changeRequest ?? {
    reasons: [], types: [], otherTypeText: null, projectEffect: null, additionalDetails: null,
    fieldChanges: [], cycleChanges: [], newItems: [],
  };
  const unreadable = [];
  const read = (field) => {
    if (!field) return null;
    const rows = parseList(field.value);
    if (rows === null) unreadable.push(field.label || field.name);
    return rows;
  };
  const reasonKeys = read(parts.reasons);
  const typeKeys = read(parts.types);
  const effectKey = parts.effect ? Number(parts.effect.value) : null;
  const fieldRows = read(parts.fieldChanges);
  const cycleRows = read(parts.cycleChanges);
  const newItemRows = read(parts.newItems);
  return {
    changeRequest: {
      reasons: reasonKeys ? reasonKeys.map((key) => ({ key: Number(key) })) : base.reasons,
      types: typeKeys ? typeKeys.map((key) => ({ key: Number(key) })) : base.types ?? [],
      otherTypeText: parts.otherType ? parts.otherType.value ?? null : base.otherTypeText ?? null,
      projectEffect: parts.effect
        ? (parts.effect.value != null && parts.effect.value !== '' && Number.isFinite(effectKey) ? { key: effectKey } : null)
        : base.projectEffect ?? null,
      additionalDetails: parts.details ? parts.details.value ?? null : base.additionalDetails,
      fieldChanges: fieldRows ? fieldRows.map(fieldRow) : base.fieldChanges,
      cycleChanges: cycleRows ? cycleRows.map(cycleRow) : base.cycleChanges,
      newItems: newItemRows ? newItemRows.map(mapChangeRequestNewItem) : base.newItems ?? [],
    },
    unreadable,
  };
}

/**
 * @param {{ fieldChanges: Array, cycleChanges: Array }} changeRequest
 * @param {{ boqItems: Array, subProjects: Array }} context
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
      .filter((c) => !drawn(c) && c.fieldName !== 'projectValue')
      .map(({ targetTypeKey, targetId, fieldName, newValue }) => ({ targetTypeKey, targetId, fieldName, newValue })),
    cycleChanges: changeRequest.cycleChanges
      .filter((c) => !itemIds.has(String(c.boqItemId)))
      .map(({ boqItemId, cycleId, newPlannedDate }) => ({ boqItemId, cycleId, newPlannedDate })),
  };
}

const NOTHING_KEPT = { fieldChanges: [], cycleChanges: [] };

/**
 * @param {ReturnType<typeof changeRequestTaskParts>} parts
 * @param {Object} draft
 * @param {{ subProjects: Array, kept?: ReturnType<typeof rowsKeptAsIs> }} context
 */
export function changeRequestTaskValues(parts, draft, { subProjects, kept = NOTHING_KEPT }) {
  const { body, fieldIndex, cycleIndex, newItemIndex } = createChangeRequestBody({ draft, subProjects });
  const values = {};
  if (parts.reasons) values[parts.reasons.name] = JSON.stringify(body.reasonKeys);
  if (parts.types) values[parts.types.name] = JSON.stringify(body.typeKeys);
  if (parts.otherType) values[parts.otherType.name] = body.otherTypeText;
  if (parts.effect) values[parts.effect.name] = body.projectEffectKey != null ? String(body.projectEffectKey) : null;
  if (parts.details) values[parts.details.name] = body.additionalDetails;
  if (parts.fieldChanges) values[parts.fieldChanges.name] = JSON.stringify([...body.fieldChanges, ...kept.fieldChanges]);
  if (parts.cycleChanges) values[parts.cycleChanges.name] = JSON.stringify([...body.cycleChanges, ...kept.cycleChanges]);
  if (parts.newItems) values[parts.newItems.name] = JSON.stringify(body.newItems);
  return {
    values,
    fieldIndex: parts.fieldChanges ? fieldIndex : [],
    cycleIndex: parts.cycleChanges ? cycleIndex : [],
    newItemIndex: parts.newItems ? newItemIndex : [],
  };
}

const REQUEST_KEY = /^(fieldChanges|cycleChanges|newItems|reasonKeys|typeKeys|otherTypeText|projectEffectKey|additionalDetails|changes)\b/i;

/**
 * @returns {{ placed: ReturnType<typeof mapServerErrors>, rest: Object }}
 */
export function splitChangeRequestErrors(errors, { fieldIndex, cycleIndex, newItemIndex = [] }) {
  const mine = {};
  const rest = {};
  for (const [rawKey, messages] of Object.entries(errors ?? {})) {
    const key = String(rawKey).replace(/^values\./i, '');
    if (REQUEST_KEY.test(key)) mine[key] = messages;
    else rest[rawKey] = messages;
  }
  return { placed: mapServerErrors(mine, { fieldIndex, cycleIndex, newItemIndex }), rest };
}

export function canTakeOut(item, asks) {
  if (!asks.fieldChanges && changedItemFields(item).length > 0) return false;
  if (!asks.cycleChanges && planChanged(item)) return false;
  return true;
}
