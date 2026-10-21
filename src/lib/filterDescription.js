/**
 * Plain-English summaries of a FilterGroup.
 *
 * A condition is edited in one place and *read* in several — the label on a
 * transition row, a branch step's collapsed header, a parallel step's "stop
 * early when…". Those readers need a sentence, not an expanded tree, and they
 * must all say the same thing, so the phrasing lives here rather than being
 * rewritten at each call site.
 */

import { FILTER_OPERATOR, FILTER_OPERATOR_LABELS, MATCH, VALUELESS_OPERATORS } from '@/constants/workflow';
import { describePlaceholder, readPlaceholder, validatePlaceholderValue } from '@/utils/workflowPlaceholder';
import { valueLabel } from '@/lib/workflowFieldOptions';

/** True when a group holds no conditions at any depth — i.e. matches everything. */
export function isEmptyGroup(group) {
  if (!group) return true;
  const hasConditions = (group.conditions ?? []).length > 0;
  const hasGroups = (group.groups ?? []).some((g) => !isEmptyGroup(g));
  return !hasConditions && !hasGroups;
}

/** Total conditions at every depth — for "3 conditions" style counts. */
export function countConditions(group) {
  if (!group) return 0;
  return (
    (group.conditions ?? []).length +
    (group.groups ?? []).reduce((sum, g) => sum + countConditions(g), 0)
  );
}

function labelForField(fieldName, fields) {
  const match = fields.find((f) => f.name === fieldName);
  return match?.label || fieldName || 'a field';
}

function describeCondition(condition, fields) {
  const field = labelForField(condition.field, fields);
  const operator = FILTER_OPERATOR_LABELS[condition.operator] ?? condition.operator ?? '?';

  if (VALUELESS_OPERATORS.includes(condition.operator)) return `${field} ${operator}`;

  if (condition.value === '' || condition.value == null) return `${field} ${operator} …`;

  // A placeholder reads as what it means — "7 days after today" rather than
  // "{{today+7d}}". The braces are syntax the author should not have to parse
  // back out of a summary line.
  const spoken = describePlaceholder(readPlaceholder(condition.value));
  if (spoken) return `${field} ${operator} ${spoken}`;

  // A value that is really a key reads as what it stands for: statusId 3 as
  // "Submitted", an outcome key as its button, a user id as the person's name.
  const named = valueLabel(fields.find((f) => f.name === condition.field), condition.value);
  return `${field} ${operator} ${named ?? condition.value}`;
}

/**
 * One sentence for a whole group.
 *
 * Nested groups are wrapped in brackets so precedence stays visible — "a and
 * (b or c)" means something different from "(a and b) or c", and a summary
 * that flattened them would be quietly wrong.
 *
 * An empty group matches everything. It used to read as "always", which was
 * wrong in the place it was read most: on a transition, "always" is not a
 * condition, it is the absence of one, and printing it as though it were a
 * condition is what let a stage grow a second transition underneath an
 * unconditional one. Callers that mean "otherwise" now say so themselves.
 *
 * @param {Object} group
 * @param {Array} [fields] field catalog, for labels rather than raw names
 * @param {number} [maxParts] beyond this, the tail is summarised as "+n more"
 * @param {string} [emptyText] what an empty group reads as
 * @returns {string}
 */
export function describeFilterGroup(group, fields = [], maxParts = 3, emptyText = 'no conditions') {
  if (isEmptyGroup(group)) return emptyText;

  const joiner = group.match === MATCH.ANY ? ' or ' : ' and ';

  const parts = [
    ...(group.conditions ?? []).map((c) => describeCondition(c, fields)),
    ...(group.groups ?? [])
      .filter((g) => !isEmptyGroup(g))
      .map((g) => `(${describeFilterGroup(g, fields, maxParts)})`),
  ];

  if (parts.length <= maxParts) return parts.join(joiner);

  // Comma rather than another "and" — repeating the joiner reads as though the
  // count were itself a condition ("… and +2 more").
  const shown = parts.slice(0, maxParts).join(joiner);
  return `${shown}, +${parts.length - maxParts} more`;
}

/**
 * Reasons a group would be refused, or would behave unexpectedly.
 *
 * `filterableOnly` is the `query` / schedule-`scan` case: those can only
 * *search* on fields the module has indexed, and naming any other field is
 * WF-030. Everywhere else a field can be read freely, so the same condition
 * shape is legal in one place and not another.
 *
 * @param {Object} group
 * @param {Array} fields
 * @param {{filterableOnly?: boolean, allowUnknownFields?: boolean}} [options]
 * @returns {string[]}
 */
export function validateFilterGroup(
  group, fields, { filterableOnly = false, allowUnknownFields = false, builtinsOnly = false } = {}
) {
  const errors = [];
  if (!group) return errors;

  for (const condition of group.conditions ?? []) {
    /*
     * The value first, because a bad placeholder is wrong whatever the field
     * turns out to be. `builtinsOnly` is the schedule-`scan` case: a scan runs
     * before any instance exists, so there is no run to answer a variable name
     * and only {{today}} / {{now}} mean anything there.
     */
    errors.push(
      ...validatePlaceholderValue(condition.value, {
        builtinsOnly,
        label: condition.field ? `"${labelForField(condition.field, fields)}"` : 'A condition',
      })
    );

    if (!condition.field) {
      errors.push('A condition has no field chosen.');
      continue;
    }

    const field = fields.find((f) => f.name === condition.field);

    /*
     * A field the catalog does not know is never reported (2026-10-13). An
     * admin can switch a field Off in Workflow fields, and GetFields then
     * leaves it out — but a saved workflow using it still runs and still
     * publishes. A step outcome like `fin.outcome`, or a field of another
     * target type, is absent for the same harmless reason. `allowUnknownFields`
     * is kept for its callers; it no longer changes anything.
     */
    if (!field) continue;

    if (filterableOnly && !field.filterable) {
      errors.push(`"${field.label}" can be read in a condition but not searched, so it cannot be used here.`);
    }

    if (!condition.operator) {
      errors.push(`"${field.label}" has no comparison chosen.`);
      continue;
    }

    if (field.operators?.length > 0 && !field.operators.includes(condition.operator)) {
      errors.push(`"${FILTER_OPERATOR_LABELS[condition.operator] ?? condition.operator}" cannot be used on "${field.label}".`);
    }

    const needsValue = !VALUELESS_OPERATORS.includes(condition.operator);
    if (needsValue && (condition.value === '' || condition.value == null)) {
      errors.push(`"${field.label}" needs a value to compare against.`);
    }
  }

  for (const nested of group.groups ?? []) {
    errors.push(...validateFilterGroup(nested, fields, { filterableOnly, allowUnknownFields, builtinsOnly }));
  }

  return errors;
}

/** The operators to offer for a field, falling back to all nine when unknown. */
export function operatorsForField(fieldName, fields) {
  const field = fields.find((f) => f.name === fieldName);
  if (field?.operators?.length > 0) return field.operators;
  return Object.values(FILTER_OPERATOR);
}
