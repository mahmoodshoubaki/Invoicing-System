/** Condition builders — one FilterGroup shape, used everywhere. */

import { MATCH } from '@/constants/workflow';

/**
 * A condition group. Also the "otherwise" arm when left empty: an empty group
 * matches everything, which is why a catch-all transition belongs last.
 *
 * @param {Object} [init]
 * @param {'all'|'any'} [init.match]
 * @param {Array}  [init.conditions]
 * @param {Array}  [init.groups]
 */
export function createFilterGroup({ match = MATCH.ALL, conditions = [], groups = [] } = {}) {
  return { match, conditions, groups };
}

/**
 * A single condition.
 *
 * `value` is serialised as a **string whatever the field's type** — the server
 * parses it against the property's real type. Passing a number here would work
 * by accident today and break the moment the backend tightens its binding.
 *
 * @param {Object} init
 * @param {string} init.field
 * @param {string} init.operator
 * @param {*}      [init.value]
 */
export function createFilterCondition({ field, operator, value = '' }) {
  return {
    field,
    operator,
    value: value == null ? '' : String(value),
  };
}

/** True when a group holds nothing — i.e. it matches everything. */
export function isEmptyFilterGroup(group) {
  if (!group) return true;
  const hasConditions = (group.conditions ?? []).length > 0;
  const hasGroups = (group.groups ?? []).some((g) => !isEmptyFilterGroup(g));
  return !hasConditions && !hasGroups;
}
