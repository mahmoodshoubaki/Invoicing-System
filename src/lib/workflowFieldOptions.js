import { TARGET_TYPE, VARIABLE_TYPE } from '@/constants/workflow';

export const PERSON_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPersonField(field) {
  return field?.isUser === true || field?.typeKey === VARIABLE_TYPE.USER;
}

const LOOKUP_FIELDS = {
  [TARGET_TYPE.BOQ_ITEM]: {
    statusId: 'boqItemStatuses',
    billingFrequencyId: 'billingFrequencies',
  },
  [TARGET_TYPE.BOQ_CHANGE_REQUEST]: {
    projectEffectKey: 'changeRequestProjectEffects',
  },
};

/**
 * @param {Object} fieldsByTargetType
 * @param {Object} lists
 */
export function withLookupOptions(fieldsByTargetType, lists) {
  let changed = false;
  const next = { ...fieldsByTargetType };

  for (const [typeKey, mapped] of Object.entries(LOOKUP_FIELDS)) {
    const fields = fieldsByTargetType[typeKey];
    if (!fields?.length) continue;

    next[typeKey] = fields.map((field) => {
      const list = lists?.[mapped[field.name]];
      if (!list?.length) return field;
      changed = true;
      return {
        ...field,
        // Strings, because every condition value travels as a string.
        valueOptions: list.map((row) => ({ key: String(row.id), label: row.label ?? String(row.id) })),
      };
    });
  }

  return changed ? next : fieldsByTargetType;
}

/**
 * @param {Array} fields
 * @param {Object} namesById
 */
export function withPersonNames(fields, namesById) {
  if (!fields?.some(isPersonField)) return fields;
  return fields.map((field) => (isPersonField(field) ? { ...field, valueLabels: namesById } : field));
}

export function withPersonNamesByType(fieldsByTargetType, namesById) {
  const next = {};
  for (const [typeKey, fields] of Object.entries(fieldsByTargetType)) {
    next[typeKey] = withPersonNames(fields, namesById);
  }
  return next;
}

export function valueLabel(field, value) {
  if (value == null || value === '') return null;
  const option = (field?.valueOptions ?? field?.outcomeValues)?.find((o) => String(o.key) === String(value));
  if (option) return option.label;
  return field?.valueLabels?.[String(value).toLowerCase()] ?? null;
}

/**
 * @param {Object} resolvedById
 */
export function personNames(resolvedById) {
  const names = {};
  for (const user of Object.values(resolvedById ?? {})) {
    if (user?.id && user.displayName) names[String(user.id).toLowerCase()] = user.displayName;
    if (user?.username && user.displayName) names[String(user.username).toLowerCase()] = user.displayName;
  }
  return names;
}
