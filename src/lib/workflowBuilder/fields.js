import {
  OPERATORS_BY_TYPE,
  OUTCOME_FIELD_SUFFIX,
  PICKED_TARGETS_LABEL,
  PICKED_TARGETS_LIST,
  STEP_TYPE,
  TARGET_TYPE,
  TRIGGER_KIND,
  VARIABLE_TYPE,
  isComparableField,
} from '@/constants/workflow';
import { PERSON_ID } from '@/lib/workflowFieldOptions';

import { eachStep } from './graph';

/**
 * @param {Object} state
 * @param {Array} catalogFields
 * @returns {Array}
 */
export function conditionFields(state, catalogFields = []) {
  const manyTargetsPossible = state.trigger?.kind === TRIGGER_KIND.MANUAL
    && state.targetTypeKey != null
    && state.targetTypeKey !== TARGET_TYPE.NONE;

  const comparable = catalogFields.filter(isComparableField);
  const fields = manyTargetsPossible
    ? comparable.map((f) => ({ ...f, emptyOnManyTargets: true }))
    : comparable;

  for (const variable of state.variables ?? []) {
    if (!variable.name) continue;
    fields.push({
      name: variable.name,
      label: variable.label || variable.name,
      typeKey: variable.type ?? 'text',
      filterable: false,
      operators: OPERATORS_BY_TYPE[variable.type] ?? OPERATORS_BY_TYPE.text,
      source: 'variable',
      ...(variable.type === VARIABLE_TYPE.USER ? { isUser: true } : {}),
    });
  }

  eachStep(state.graph, (step) => {
    if (step.type !== STEP_TYPE.HUMAN_TASK || !step.id) return;
    fields.push({
      name: `${step.id}${OUTCOME_FIELD_SUFFIX}`,
      label: `${step.title || step.id} — answer`,
      typeKey: 'text',
      filterable: false,
      operators: ['eq', 'neq'],
      source: 'outcome',
      outcomeValues: (step.outcomes ?? []).map((o) => ({ key: o.key, label: o.label || o.key })),
    });
  });

  return fields;
}

export function availableLists(state) {
  const lists = [];

  if (
    state.trigger?.kind === TRIGGER_KIND.MANUAL
    && state.targetTypeKey != null
    && state.targetTypeKey !== TARGET_TYPE.NONE
  ) {
    lists.push({ name: PICKED_TARGETS_LIST, label: PICKED_TARGETS_LABEL, targetTypeKey: state.targetTypeKey });
  }

  for (const v of state.variables ?? []) {
    if (v.type !== VARIABLE_TYPE.LIST || !v.name) continue;
    lists.push({ name: v.name, label: v.label || v.name, targetTypeKey: null });
  }

  eachStep(state.graph, (step) => {
    if (step.type === STEP_TYPE.QUERY && step.into) {
      lists.push({
        name: step.into,
        label: step.title || step.into,
        targetTypeKey: step.targetTypeKey ?? null,
      });
    }
  });

  return lists;
}

export function referencedPersonIds(state) {
  const ids = new Set();
  const take = (value) => {
    if (typeof value === 'string' && PERSON_ID.test(value.trim())) ids.add(value.trim());
  };
  const walkGroup = (group) => {
    if (!group) return;
    for (const c of group.conditions ?? []) take(c.value);
    for (const g of group.groups ?? []) walkGroup(g);
  };

  for (const v of state.variables ?? []) {
    if (v.type === VARIABLE_TYPE.USER) take(v.defaultValue);
  }
  walkGroup(state.trigger?.scan);
  for (const stage of state.graph?.stages ?? []) {
    for (const t of stage.transitions ?? []) walkGroup(t.condition);
  }
  eachStep(state.graph, (step) => {
    walkGroup(step.condition);
    walkGroup(step.until);
    walkGroup(step.joinWhen);
    walkGroup(step.filter);
    for (const id of step.toUserIds ?? []) take(id);
    for (const id of step.ccUserIds ?? []) take(id);
  });

  return [...ids].sort();
}

export const ITEM_TARGET_ID = 'targetId';

/**
 * @param {Object} step
 * @param {Array} lists
 * @param {Object} fieldsByTargetType
 */
export function itemFields(step, lists = [], fieldsByTargetType = {}) {
  const itemName = step?.itemName?.trim();
  if (!itemName || !step?.source) return [];

  const list = lists.find((l) => l.name === step.source);
  if (!list || list.targetTypeKey == null) return [];

  const source = (fieldsByTargetType[list.targetTypeKey] ?? []).filter(isComparableField);

  const fields = source.map((f) => ({
    ...f,
    name: `${itemName}.${f.name}`,
    label: `${itemName}.${f.label ?? f.name}`,
    filterable: false,
    source: 'item',
  }));

  fields.push({
    name: `${itemName}.${ITEM_TARGET_ID}`,
    label: `${itemName}.id`,
    typeKey: 'text',
    filterable: false,
    operators: ['eq', 'neq', 'isEmpty', 'isNotEmpty'],
    source: 'item',
  });

  return fields;
}

export function isItemShapeUnknown(step, lists = [], fieldsByTargetType = {}) {
  if (!step?.source || !step?.itemName?.trim()) return false;
  const list = lists.find((l) => l.name === step.source);
  if (!list) return true;
  if (list.targetTypeKey == null) return true;
  return (fieldsByTargetType[list.targetTypeKey] ?? []).length === 0;
}
