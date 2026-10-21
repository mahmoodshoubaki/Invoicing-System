/**
 * A run's values, corrected before resuming it (2026-10-21) — GetInstanceVariables
 * in, ResumeInstance's `variableChanges` out.
 *
 * Each value is a box of text. A variable holding fields (a project found by a
 * query step, a loop's item) is opened one level down — `project.bdmUsername`
 * can be changed, nothing deeper, which is as far as the server goes. Its type
 * is the declared one or, for one nothing declares and for a field, the kind
 * of value it holds now, as the server reads it: a number stays a number, a
 * list stays a list.
 *
 * Only what changed is sent; an emptied box clears the value (null). One wrong
 * value refuses them all — WF-058, keyed `variableChanges[name]`.
 */

import { INSTANCE_STATUS, VARIABLE_TYPE } from '@/constants/workflow';
import { typeMismatch } from '@/lib/workflowBuilder/variables';

const isFields = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const DAY = /^(\d{4}-\d{2}-\d{2})/;

/** The kind of value held, as the server reads one that nothing declares. */
export function typeOfValue(value) {
  if (typeof value === 'number') return VARIABLE_TYPE.NUMBER;
  if (typeof value === 'boolean') return VARIABLE_TYPE.BOOLEAN;
  if (Array.isArray(value)) return VARIABLE_TYPE.LIST;
  return VARIABLE_TYPE.TEXT;
}

/** What a value's box starts with. A date keeps only its day. */
export function textOf(value, type) {
  if (value == null) return '';
  if (typeof value === 'string') return type === VARIABLE_TYPE.DATE ? DAY.exec(value)?.[1] ?? value : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

/**
 * The rows to show: one per value, and a variable holding fields as a heading
 * with a row per field under it. A field that itself holds fields is shown,
 * never changed.
 *
 * @param {Array<{ name: string, type: string|null, value: * }>} variables
 * @returns {Array<{ name: string, type: string|null, text: string, editable: boolean, group?: boolean, parent?: string }>}
 */
export function variableRows(variables) {
  const rows = [];
  for (const variable of variables ?? []) {
    if (isFields(variable.value) && !variable.type) {
      rows.push({ name: variable.name, type: null, text: '', editable: false, group: true });
      for (const [key, value] of Object.entries(variable.value)) {
        const type = typeOfValue(value);
        rows.push({ name: `${variable.name}.${key}`, parent: variable.name, type, text: textOf(value, type), editable: !isFields(value) });
      }
    } else {
      const type = variable.type ?? typeOfValue(variable.value);
      rows.push({ name: variable.name, type, text: textOf(variable.value, type), editable: !isFields(variable.value) });
    }
  }
  return rows;
}

/**
 * Why a box's text would be refused, as a sentence — or null. A person is
 * left to the server: it takes a username as well as a user id.
 */
export function valueProblem(row, text) {
  if (row.type === VARIABLE_TYPE.USER || String(text ?? '').trim() === '') return null;
  const why = typeMismatch(text, row.type);
  return why ? `${why.charAt(0).toUpperCase()}${why.slice(1)}.` : null;
}

/**
 * `variableChanges` for ResumeInstance: only the boxes that changed, by name;
 * an emptied one is null, which clears the value.
 *
 * @param {Array} rows  variableRows'
 * @param {Object<string, string>} edits  the boxes' text, by name, where edited
 */
export function variableChanges(rows, edits) {
  const changes = {};
  for (const row of rows) {
    if (!row.editable || !(row.name in edits) || edits[row.name] === row.text) continue;
    changes[row.name] = String(edits[row.name]).trim() === '' ? null : edits[row.name];
  }
  return changes;
}

/**
 * A WF-058 refusal's errors, by the value they are about — the keys are
 * `variableChanges[name]` — and the rest.
 *
 * @returns {{ byName: Object<string, string>, other: string[] }}
 */
export function variableChangeErrors(errors) {
  const byName = {};
  const other = [];
  for (const [key, messages] of Object.entries(errors ?? {})) {
    const text = (Array.isArray(messages) ? messages : [messages]).filter(Boolean).join(' ');
    if (!text) continue;
    const named = /^variableChanges\[(.+)\]$/i.exec(key);
    if (named) byName[named[1]] = text;
    else other.push(text);
  }
  return { byName, other };
}

/**
 * Why a run just resumed has stopped again, or null when it has not. A
 * corrected value can still be wrong, and the step faults on it again.
 */
export function faultedAgain(run) {
  if (run?.statusKey !== INSTANCE_STATUS.FAULTED) return null;
  return run.failureReason || 'It stopped again on the same step.';
}
