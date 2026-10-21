import { TRIGGER_KIND, VARIABLE_TYPE } from '@/constants/workflow';
import { PERSON_ID } from '@/lib/workflowFieldOptions';

/**
 * A workflow's variables: what each starts as, and whether a value fits its type.
 */

/**
 * What a variable holds when the run starts and nothing set it.
 *
 * `defaultValue` now applies to every trigger type, not just manual — so a
 * variable is never "not there yet", and the editor can state what a run really
 * begins with instead of leaving it blank and implying nothing.
 *
 * A value the run was STARTED with beats the default; this is the floor.
 */
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

/**
 * Reasons a `defaultValue` would be refused — WF-044.
 *
 * It is always a STRING on the wire, whatever the declared type, and the server
 * parses it against that type. So the check here is "would this parse", not
 * "is this the right JavaScript type".
 */
export function defaultValueErrors(variable) {
  const why = typeMismatch(variable?.defaultValue, variable?.type);
  if (!why) return [];

  const name = variable.label || variable.name || 'A variable';
  return [`"${name}" starts as "${String(variable.defaultValue).trim()}", which is ${why}.`];
}

/**
 * Why a string will not parse as `type`, phrased as a fragment — or null.
 *
 * A fragment rather than a sentence because the same check reads differently
 * depending on where it fires: a declared default "starts as … which is not a
 * number", while a value typed when starting a run just "is not a number".
 * Both need the identical rule, and the server applies exactly one.
 *
 * Empty is never a mismatch. Whether empty is ALLOWED is a `required` question,
 * which is a different one.
 */
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
      // A list is written as JSON. Anything else the server cannot turn into
      // one, and a forEach over it would find nothing.
      try {
        return Array.isArray(JSON.parse(text)) ? null : 'not a list. Write it as ["a","b"]';
      } catch {
        return 'not a list. Write it as ["a","b"]';
      }

    case VARIABLE_TYPE.USER:
      // A user id, never a username — the engine refuses anything else.
      return PERSON_ID.test(text) ? null : "not a person's user id — a username like DOMAIN\\jdoe won't do here";

    default:
      return null;
  }
}

/**
 * Every name a `setVariable` step may write to.
 *
 * A manual trigger's inputs are variables too — the run is started with them —
 * so both lists count. Matching is case-sensitive server-side, which is why
 * this is the set the editor picks from rather than something an author types.
 */
export function declaredVariableNames(state) {
  const names = new Set();
  for (const v of state?.variables ?? []) if (v?.name) names.add(v.name);
  if (state?.trigger?.kind === TRIGGER_KIND.MANUAL) {
    for (const input of state.trigger.inputs ?? []) if (input?.name) names.add(input.name);
  }
  return names;
}
