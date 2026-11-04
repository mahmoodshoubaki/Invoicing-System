import { INSTANCE_STATUS, VARIABLE_TYPE } from '@/constants/workflow';
import { typeMismatch } from '@/lib/workflowBuilder/variables';

const isFields = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const DAY = /^(\d{4}-\d{2}-\d{2})/;

export function typeOfValue(value) {
  if (typeof value === 'number') return VARIABLE_TYPE.NUMBER;
  if (typeof value === 'boolean') return VARIABLE_TYPE.BOOLEAN;
  if (Array.isArray(value)) return VARIABLE_TYPE.LIST;
  return VARIABLE_TYPE.TEXT;
}

export function textOf(value, type) {
  if (value == null) return '';
  if (typeof value === 'string') return type === VARIABLE_TYPE.DATE ? DAY.exec(value)?.[1] ?? value : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

/**
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

export function valueProblem(row, text) {
  if (row.type === VARIABLE_TYPE.USER || String(text ?? '').trim() === '') return null;
  const why = typeMismatch(text, row.type);
  return why ? `${why.charAt(0).toUpperCase()}${why.slice(1)}.` : null;
}

/**
 * @param {Array} rows
 * @param {Object<string, string>} edits
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

export function faultedAgain(run) {
  if (run?.statusKey !== INSTANCE_STATUS.FAULTED) return null;
  return run.failureReason || 'It stopped again on the same step.';
}
