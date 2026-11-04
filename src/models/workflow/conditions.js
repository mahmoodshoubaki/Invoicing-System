import { MATCH } from '@/constants/workflow';

/**
 * @param {Object} [init]
 * @param {'all'|'any'} [init.match]
 * @param {Array} [init.conditions]
 * @param {Array} [init.groups]
 */
export function createFilterGroup({ match = MATCH.ALL, conditions = [], groups = [] } = {}) {
  return { match, conditions, groups };
}

/**
 * @param {Object} init
 * @param {string} init.field
 * @param {string} init.operator
 * @param {*} [init.value]
 */
export function createFilterCondition({ field, operator, value = '' }) {
  return {
    field,
    operator,
    value: value == null ? '' : String(value),
  };
}

export function isEmptyFilterGroup(group) {
  if (!group) return true;
  const hasConditions = (group.conditions ?? []).length > 0;
  const hasGroups = (group.groups ?? []).some((g) => !isEmptyFilterGroup(g));
  return !hasConditions && !hasGroups;
}
