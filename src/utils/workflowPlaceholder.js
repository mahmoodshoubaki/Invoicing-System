/**
 * The `{{…}}` grammar for a condition's value.
 *
 * A condition value used to be a literal string. It now runs through the
 * engine's placeholder resolver first, which is what makes "on or before today"
 * mean the day the run reaches the condition rather than the day somebody drew
 * the workflow.
 *
 * Three things can sit in the braces and they are NOT interchangeable:
 *
 *   {{today}} {{now}}      built-ins, computed at the moment of the check
 *   {{today+7d}}           an offset — legal on a built-in and ONLY on one
 *   {{reviewDeadline}}     a name the run answers: a variable, a field on the
 *                          tracked record, or a loop item
 *
 * The offset rule is the one that catches people. `{{reviewDeadline+7d}}` looks
 * like the obvious extension of `{{today+7d}}` and is refused at save as
 * WF-037, so the editor has to stop offering the control the moment a name is
 * chosen rather than let it be typed and rejected later.
 */

import {
  PLACEHOLDER_BUILTIN,
  PLACEHOLDER_BUILTIN_INFO,
  PLACEHOLDER_OFFSET_UNITS,
  SECRETS_PREFIX,
} from '@/constants/workflow';

/** The whole value is one placeholder — the only shape the editor produces. */
const WHOLE = /^\{\{([^{}]*)\}\}$/;

/** `name+7d` / `name-4h`. The unit set is fixed by the engine: d, h, m. */
const OFFSET = /^([A-Za-z_][\w.]*)\s*([+-])\s*(\d+)\s*([dhm])$/;

/** A bare name, possibly dotted for a loop item or a record field. */
const BARE = /^[A-Za-z_][\w.]*$/;

const BUILTINS = new Set(Object.values(PLACEHOLDER_BUILTIN));

/** Case-insensitive, because the engine still accepts bare `Today` / `Now`. */
export function isBuiltin(name) {
  return BUILTINS.has(String(name ?? '').toLowerCase());
}

/**
 * What a condition value actually is.
 *
 * `literal` covers plain text AND text with a placeholder embedded in it
 * (`INV-{{year}}`). Those still resolve at run time, so they are not an error —
 * they are simply not something the structured editor can round-trip, and are
 * left in the free-text box.
 *
 * @returns {{kind: 'literal'|'builtin'|'name'|'secret'|'malformed', …}}
 */
export function readPlaceholder(value) {
  if (typeof value !== 'string') return { kind: 'literal' };

  const match = WHOLE.exec(value.trim());
  if (!match) return { kind: 'literal' };

  const inner = match[1].trim();
  if (inner === '') return { kind: 'malformed', reason: 'empty' };

  if (inner.toLowerCase().startsWith(SECRETS_PREFIX)) return { kind: 'secret', name: inner };

  const offset = OFFSET.exec(inner);
  if (offset) {
    const [, name, sign, amount, unit] = offset;
    if (!isBuiltin(name)) return { kind: 'malformed', reason: 'offsetOnName', name };
    return { kind: 'builtin', name: name.toLowerCase(), sign, amount: Number(amount), unit };
  }

  if (!BARE.test(inner)) return { kind: 'malformed', reason: 'syntax', name: inner };

  if (isBuiltin(inner)) {
    return { kind: 'builtin', name: inner.toLowerCase(), sign: '+', amount: 0, unit: 'd' };
  }

  return { kind: 'name', name: inner };
}

/** A built-in, with its offset only when there is one to write. */
export function writeBuiltin(name, { sign = '+', amount = 0, unit = 'd' } = {}) {
  const n = Number(amount) || 0;
  return n > 0 ? `{{${name}${sign}${n}${unit}}}` : `{{${name}}}`;
}

/** A name the run answers. Never carries an offset — see the file header. */
export function writeName(name) {
  return `{{${name}}}`;
}

/**
 * Reasons the server would refuse this value, in the author's words.
 *
 * `builtinsOnly` is the schedule-`scan` case: a scan runs before any instance
 * exists, so there is no run to answer a variable name and only the two
 * built-ins mean anything there.
 */
export function validatePlaceholderValue(value, { builtinsOnly = false, label = 'A condition' } = {}) {
  const errors = [];
  if (typeof value !== 'string' || value === '') return errors;

  // Unbalanced braces anywhere, including inside an otherwise-literal string —
  // `{{today` resolves to nothing and the run fails rather than the save.
  const opens = (value.match(/\{\{/g) ?? []).length;
  const closes = (value.match(/\}\}/g) ?? []).length;
  if (opens !== closes) {
    errors.push(`${label} has an unclosed {{…}} in its value.`);
    return errors;
  }
  if (opens === 0) return errors;

  const parsed = readPlaceholder(value);

  switch (parsed.kind) {
    case 'secret':
      errors.push(`${label} compares against a credential. That is refused — a secret can be sent in a request header, never read in a condition.`);
      break;
    case 'malformed':
      if (parsed.reason === 'empty') {
        errors.push(`${label} has an empty {{}} in its value.`);
      } else if (parsed.reason === 'offsetOnName') {
        errors.push(`${label} adds an offset to "${parsed.name}", which only works on today and now. Compare against the value itself, or use {{today}}.`);
      } else {
        errors.push(`${label} has a {{…}} that is not a name the run can answer.`);
      }
      break;
    case 'name':
      if (builtinsOnly) {
        errors.push(`${label} uses "${parsed.name}", but a schedule's filter runs before any run exists, so only today and now can be used here.`);
      }
      break;
    default:
      break;
  }

  return errors;
}

/** Prose for a summary line: "7 days after today". */
export function describePlaceholder(parsed) {
  if (parsed.kind === 'builtin') {
    const base = PLACEHOLDER_BUILTIN_INFO[parsed.name]?.label.toLowerCase() ?? parsed.name;
    if (!parsed.amount) return base;
    const unit = PLACEHOLDER_OFFSET_UNITS.find((u) => u.key === parsed.unit)?.label ?? parsed.unit;
    const amount = parsed.amount === 1 ? unit.replace(/s$/, '') : unit;
    return `${parsed.amount} ${amount} ${parsed.sign === '-' ? 'before' : 'after'} ${base}`;
  }
  if (parsed.kind === 'name') return parsed.name;
  return null;
}
