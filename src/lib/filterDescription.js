import { FILTER_OPERATOR, FILTER_OPERATOR_LABELS, MATCH, VALUELESS_OPERATORS } from '@/constants/workflow';
import { describePlaceholder, readPlaceholder, validatePlaceholderValue } from '@/utils/workflowPlaceholder';
import { valueLabel } from '@/lib/workflowFieldOptions';

export function isEmptyGroup(group) {
  if (!group) return true;
  const hasConditions = (group.conditions ?? []).length > 0;
  const hasGroups = (group.groups ?? []).some((g) => !isEmptyGroup(g));
  return !hasConditions && !hasGroups;
}

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

  const spoken = describePlaceholder(readPlaceholder(condition.value));
  if (spoken) return `${field} ${operator} ${spoken}`;

  const named = valueLabel(fields.find((f) => f.name === condition.field), condition.value);
  return `${field} ${operator} ${named ?? condition.value}`;
}

/**
 * @param {Object} group
 * @param {Array} [fields]
 * @param {number} [maxParts]
 * @param {string} [emptyText]
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

  const shown = parts.slice(0, maxParts).join(joiner);
  return `${shown}, +${parts.length - maxParts} more`;
}

/**
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

export function operatorsForField(fieldName, fields) {
  const field = fields.find((f) => f.name === fieldName);
  if (field?.operators?.length > 0) return field.operators;
  return Object.values(FILTER_OPERATOR);
}
