/**
 * The fields a task asks its holder to fill (2026-10-11), between the form and
 * the wire.
 *
 * Both ways, values are TEXT in one invariant format: numbers with a dot and no
 * thousands separator ("1234.50"), yes/no as "true" / "false", dates as
 * "2026-11-30". A task row's `value` is the record's current value in that
 * format, so a half-filled task opens with what is already there.
 *
 * A button with `requiresFields` saves every field with the press, and its
 * required ones must be filled; a button without it saves nothing, so nothing
 * is sent for it. Only the task's own fields may be sent — any other name is
 * refused (WF-055), so nothing else is ever put in `values`.
 *
 * An id is text like any other ("3f2504e0-…"). A BOQ item's invoicing plan
 * (2026-10-13) is JSON text — see lib/invoicingPlanValue. An invoice's
 * attachments (`files`) are a draft in the form — see lib/taskFileValue — and
 * its `lines` (`list`) are only ever shown, never sent.
 */

import { FILES_TYPE, INVOICING_PLAN_TYPE, LIST_TYPE } from '@/constants/workflow';
import { parsePlanValue, planValueToSend } from '@/lib/invoicingPlanValue';
import { filesAfterSave, filesValueToSend, initialFilesDraft, isStillAdding } from '@/lib/taskFileValue';

const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})/;
const NUMBER = /^-?\d+(\.\d+)?$/;

/** What a box shows for a field's current value. A date keeps only its day. */
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

/** Every field's starting value, keyed by name. */
export function initialValues(fields) {
  return Object.fromEntries((fields ?? []).map((f) => [f.name, inputValueOf(f)]));
}

const isEmpty = (value) => value == null || String(value).trim() === '';

/** What stops a saving button on one field before anything is sent; null when nothing. */
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
 * What stops a button before anything is sent: a required field left empty or
 * a number that is not one (only for a button that saves the fields), and a
 * missing comment where the button asks for one.
 *
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

/**
 * `values` for CompleteTask: every field as text (empty → null) for a saving
 * button, nothing otherwise. A list is never sent; a files field sends only
 * its removals here (its new files go as parts — filesToSend).
 */
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

/** Whether a task has a files field, and so is answered through CompleteTaskWithFiles. */
export const hasFilesField = (fields) => (fields ?? []).some((f) => f.typeKey === FILES_TYPE);

/** The new files to send, by field name, for a saving button; nothing otherwise. */
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
 * A refusal's `errors` (keyed by field: WF-055 from the workflow, INV-012 from
 * the invoice, BOQ-011 from a BOQ item, an attachment's limits), split into the
 * ones that belong under a box and the rest. Keys are matched to the task's
 * fields ignoring case, and with any `Values.` / `Values[...]` wrapping taken off.
 *
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
