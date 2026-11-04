import { FILES_TYPE, INVOICING_PLAN_TYPE, LIST_TYPE } from '@/constants/workflow';
import { parsePlanValue, planValueToSend } from '@/lib/invoicingPlanValue';
import { filesAfterSave, filesValueToSend, initialFilesDraft, isStillAdding } from '@/lib/taskFileValue';

const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})/;
const NUMBER = /^-?\d+(\.\d+)?$/;

export function inputValueOf(field) {
  if (field?.typeKey === FILES_TYPE) return initialFilesDraft(field);
  const raw = field?.value;
  if (raw == null) return '';
  const text = String(raw);
  if (field.typeKey === 'date') return DATE_PREFIX.exec(text)?.[1] ?? text;
  if (field.typeKey === INVOICING_PLAN_TYPE || field.typeKey === LIST_TYPE) return text;
  if (field.typeKey === 'boolean') return text.toLowerCase() === 'true' ? 'true' : text.toLowerCase() === 'false' ? 'false' : '';
  return text;
}

export function initialValues(fields) {
  return Object.fromEntries((fields ?? []).map((f) => [f.name, inputValueOf(f)]));
}

const isEmpty = (value) => value == null || String(value).trim() === '';

function fieldProblem(field, value) {
  if (field.typeKey === LIST_TYPE) return null;
  if (field.typeKey === INVOICING_PLAN_TYPE) {
    return field.required && parsePlanValue(value).length === 0 ? 'At least one cycle is needed.' : null;
  }
  if (field.typeKey === FILES_TYPE) {
    if (isStillAdding(value)) return 'A file is still being added — a moment.';
    return field.required && filesAfterSave(value) === 0 ? 'At least one file is needed.' : null;
  }
  if (field.required && isEmpty(value)) return `${field.label || field.name} is required.`;
  if (field.typeKey === 'number' && !isEmpty(value) && !NUMBER.test(String(value).trim())) {
    return 'Use digits, with a dot for decimals — like 1234.50.';
  }
  return null;
}

/**
 * @returns {{ fieldErrors: Object<string, string>, commentError: string|null }}
 */
export function checkBeforeSubmit(fields, values, button, comment) {
  const fieldErrors = {};
  if (button?.requiresFields) {
    for (const field of fields ?? []) {
      const problem = fieldProblem(field, values?.[field.name]);
      if (problem) fieldErrors[field.name] = problem;
    }
  }
  const commentError = button?.requiresComment && isEmpty(comment) ? `"${button.label}" needs a comment.` : null;
  return { fieldErrors, commentError };
}

export function valuesToSend(fields, values, button) {
  if (!button?.requiresFields) return {};
  return Object.fromEntries(
    (fields ?? [])
      .filter((field) => field.typeKey !== LIST_TYPE)
      .map((field) => {
        const value = values?.[field.name];
        if (field.typeKey === FILES_TYPE) return [field.name, filesValueToSend(value)];
        if (field.typeKey === INVOICING_PLAN_TYPE) return [field.name, isEmpty(value) ? null : planValueToSend(value)];
        return [field.name, isEmpty(value) ? null : String(value).trim()];
      })
  );
}

export const hasFilesField = (fields) => (fields ?? []).some((f) => f.typeKey === FILES_TYPE);

export function filesToSend(fields, values, button) {
  if (!button?.requiresFields) return {};
  return Object.fromEntries(
    (fields ?? [])
      .filter((field) => field.typeKey === FILES_TYPE)
      .map((field) => [field.name, (values?.[field.name]?.added ?? []).filter((f) => f.status === 'done')])
      .filter(([, files]) => files.length > 0)
  );
}

/**
 * @returns {{ fieldErrors: Object<string, string>, other: string[] }}
 */
export function splitServerErrors(errors, fields) {
  const fieldErrors = {};
  const other = [];
  for (const [rawKey, messages] of Object.entries(errors ?? {})) {
    const key = String(rawKey).replace(/^values[.[]/i, '').replace(/]$/, '');
    const field = (fields ?? []).find((f) => f.name.toLowerCase() === key.toLowerCase());
    const text = (Array.isArray(messages) ? messages : [messages]).filter(Boolean).join(' ');
    if (!text) continue;
    if (field) fieldErrors[field.name] = text;
    else other.push(text);
  }
  return { fieldErrors, other };
}
