import { TRIGGER_KIND, VARIABLE_TYPE } from '@/constants/workflow';
import { PERSON_ID } from '@/lib/workflowFieldOptions';

export function emptyForType(type) {
  switch (type) {
    case VARIABLE_TYPE.NUMBER: return '0';
    case VARIABLE_TYPE.BOOLEAN: return 'false';
    case VARIABLE_TYPE.LIST: return 'an empty list';
    case VARIABLE_TYPE.DATE: return 'no date';
    case VARIABLE_TYPE.USER: return 'nobody';
    default: return 'empty text';
  }
}

export function defaultValueErrors(variable) {
  const why = typeMismatch(variable?.defaultValue, variable?.type);
  if (!why) return [];

  const name = variable.label || variable.name || 'A variable';
  return [`"${name}" starts as "${String(variable.defaultValue).trim()}", which is ${why}.`];
}

export function typeMismatch(value, type) {
  if (value == null || String(value).trim() === '') return null;
  const text = String(value).trim();

  switch (type) {
    case VARIABLE_TYPE.NUMBER:
      return Number.isFinite(Number(text)) ? null : 'not a number';

    case VARIABLE_TYPE.BOOLEAN:
      return ['true', 'false'].includes(text.toLowerCase()) ? null : 'not true or false';

    case VARIABLE_TYPE.DATE:
      return Number.isNaN(Date.parse(text)) ? 'not a date' : null;

    case VARIABLE_TYPE.LIST:
      try {
        return Array.isArray(JSON.parse(text)) ? null : 'not a list. Write it as ["a","b"]';
      } catch {
        return 'not a list. Write it as ["a","b"]';
      }

    case VARIABLE_TYPE.USER:
      return PERSON_ID.test(text) ? null : "not a person's user id — a username like DOMAIN\\jdoe won't do here";

    default:
      return null;
  }
}

export function declaredVariableNames(state) {
  const names = new Set();
  for (const v of state?.variables ?? []) if (v?.name) names.add(v.name);
  if (state?.trigger?.kind === TRIGGER_KIND.MANUAL) {
    for (const input of state.trigger.inputs ?? []) if (input?.name) names.add(input.name);
  }
  return names;
}
