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
 * What a condition can read: the module's fields, the workflow's variables,
 * every human task's answer, and — inside a loop — the item's fields.
 */

/**
 * Everything a condition may compare against: the module's own fields, plus
 * the workflow's variables, plus every human task's answer.
 *
 * The last two are the reason this exists. `GetFields` only knows about the
 * target module, so a variable somebody just defined, or the outcome of the
 * approval step directly above, were both invisible in the condition editor —
 * which made the most ordinary workflow of all ("if approved, go here; if
 * rejected, go there") impossible to express.
 *
 * Variables and outcomes are marked `filterable: false`: they can be READ in a
 * condition but not SEARCHED in a `query` or a schedule `scan`, which only look
 * at the module's indexed columns.
 *
 * `outcomeValues` carries a step's outcome keys so the value input can offer
 * them as a dropdown — the author picks "Approve", never types `approve`.
 *
 * @param {Object} state the builder state
 * @param {Array} catalogFields from GetFields
 * @returns {Array}
 */
export function conditionFields(state, catalogFields = []) {
  /*
   * A hand-started run reads its record's fields only when it was started on
   * ONE record. Started on several, those fields read empty and the records
   * are in `targets` instead — so on a manual workflow every record field is
   * marked, and the condition editor says so where it is read.
   */
  const manyTargetsPossible = state.trigger?.kind === TRIGGER_KIND.MANUAL
    && state.targetTypeKey != null
    && state.targetTypeKey !== TARGET_TYPE.NONE;

  // An invoicing plan is only ever asked for by a task — never compared (2026-10-13).
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
      // A person variable can be assigned a task, exactly like a record field
      // the catalog flags isUser.
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

/**
 * The lists a `forEach` can walk: the workflow's list variables, and the
 * results of every `query` step. Labelled by title, since the underlying names
 * are derived and never shown.
 */
export function availableLists(state) {
  const lists = [];

  /*
   * The records a hand-started run was started on — one row each, carrying
   * that record's fields plus `targetId`. Offered on manual workflows that
   * track something, which is where an author would loop over them: a run
   * started on several records reads none of their fields at the top level.
   */
  if (
    state.trigger?.kind === TRIGGER_KIND.MANUAL
    && state.targetTypeKey != null
    && state.targetTypeKey !== TARGET_TYPE.NONE
  ) {
    lists.push({ name: PICKED_TARGETS_LIST, label: PICKED_TARGETS_LABEL, targetTypeKey: state.targetTypeKey });
  }

  for (const v of state.variables ?? []) {
    if (v.type !== VARIABLE_TYPE.LIST || !v.name) continue;
    // A list variable is filled by the caller, so nothing here knows what its
    // rows look like. `targetTypeKey: null` is that absence, said explicitly.
    lists.push({ name: v.name, label: v.label || v.name, targetTypeKey: null });
  }

  eachStep(state.graph, (step) => {
    if (step.type === STEP_TYPE.QUERY && step.into) {
      // The target type is what makes a loop item legible: handoff §9 says each
      // row is flat, carrying that module's own fields plus `targetId`. Carry
      // it here and the editor can show the author what is actually in an item
      // instead of asking them to guess.
      lists.push({
        name: step.into,
        label: step.title || step.into,
        targetTypeKey: step.targetTypeKey ?? null,
      });
    }
  });

  return lists;
}

/**
 * Every user id a definition names outside its task assignees: a person
 * variable's starting value, and any condition comparing against a person.
 *
 * Collected so the names can be looked up — a condition reads "approver is not
 * Ahmad", never a guid. A condition value is taken when it LOOKS like a user
 * id, whatever its field: asking the directory about an id that turns out not
 * to be a person costs nothing and names nobody.
 */
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
    // A Send notification step's people, To and CC, so their chips show names.
    for (const id of step.toUserIds ?? []) take(id);
    for (const id of step.ccUserIds ?? []) take(id);
  });

  return [...ids].sort();
}

/**
 * The reserved field the engine adds to every queried row (handoff §9).
 * Written last, so a module field of the same name cannot shadow it.
 */
export const ITEM_TARGET_ID = 'targetId';

/**
 * What a `forEach` binds — the loop item's fields, as condition fields.
 *
 * These are scoped: they exist inside the loop body and nowhere else, which is
 * why they are built here per step rather than added to `conditionFields` for
 * the whole definition. Naming `invoice.totalAmount` outside its loop would be
 * a condition the engine cannot resolve.
 *
 * @param {Object} step the forEach
 * @param {Array} lists from `availableLists`
 * @param {Object} fieldsByTargetType GetFields results, keyed by target type
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
    // A loop item is held in memory, not searched, so nothing in here is a
    // filterable column however filterable the underlying module field is.
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

/**
 * True when a loop binds an item whose fields are not knowable yet.
 *
 * Distinguishes "the catalog has not arrived" from "this list has no shape" —
 * the first is temporary and must not produce errors, the second is permanent
 * and worth saying on screen.
 */
export function isItemShapeUnknown(step, lists = [], fieldsByTargetType = {}) {
  if (!step?.source || !step?.itemName?.trim()) return false;
  const list = lists.find((l) => l.name === step.source);
  if (!list) return true;
  if (list.targetTypeKey == null) return true;
  return (fieldsByTargetType[list.targetTypeKey] ?? []).length === 0;
}
