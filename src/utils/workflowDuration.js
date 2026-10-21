/**
 * The duration shape shared by a `delay` step and a stage `deadline`.
 *
 * They are the same five optional numbers plus `excludeDays`, differing only in
 * prefix — `delayDays` against `afterDays`. Reading, writing, validating and
 * describing them lives here once rather than twice, so the two cannot drift
 * apart as the engine grows more units.
 *
 * Wire format, with **only what the author filled in**:
 *
 *   { "type": "delay", "id": "cooling",
 *     "delayMonths": 1, "delayDays": 3, "delayHours": 4,
 *     "excludeDays": ["friday", "saturday"] }
 *
 * Older definitions carrying just `delayDays` / `delayMinutes` still load and
 * still save — the absent units simply read as zero.
 */

import { DURATION_UNITS, WEEKDAY_NAMES } from '@/constants/workflow';

/**
 * Pulls the five numbers and the exclusions off an object, whatever it omits.
 *
 * @param {Object} source a step or a deadline
 * @param {'delay'|'after'} prefix
 * @returns {{Years: number, Months: number, Days: number, Hours: number, Minutes: number, excludeDays: string[]}}
 */
export function readDuration(source, prefix) {
  const values = {};
  for (const unit of DURATION_UNITS) {
    values[unit.key] = source?.[`${prefix}${unit.key}`] ?? 0;
  }
  values.excludeDays = source?.excludeDays ?? [];
  return values;
}

/**
 * The inverse: an object carrying only the units that hold something.
 *
 * Zero and empty are both omitted rather than sent — "send only what the author
 * filled in" means a step waiting three days carries `delayDays` and nothing
 * else, instead of four zeroes that say the same thing less clearly.
 *
 * @param {Object} values from readDuration, or a partial update
 * @param {'delay'|'after'} prefix
 * @returns {Object} spreadable onto a step or deadline
 */
export function writeDuration(values, prefix) {
  const out = {};
  for (const unit of DURATION_UNITS) {
    const n = Number(values?.[unit.key] ?? 0);
    if (n) out[`${prefix}${unit.key}`] = n;
  }
  if (values?.excludeDays?.length > 0) out.excludeDays = values.excludeDays;
  return out;
}

/**
 * A patch that can be MERGED over an existing step or deadline, clearing what
 * the author emptied.
 *
 * Both consumers merge rather than replace — the step reducer does
 * `{ ...step, ...patch }` — so a patch that simply omitted a cleared unit would
 * let the old value survive underneath it. Every key is therefore present, set
 * to `undefined` when empty.
 *
 * That is safe all the way out: `JSON.stringify` drops undefined keys, so the
 * saved payload still carries only what was filled in, and `editableSnapshot`
 * sees the same thing for dirty tracking.
 *
 * @param {Object} values from readDuration, or a partial update
 * @param {'delay'|'after'} prefix
 * @returns {Object}
 */
export function durationPatch(values, prefix) {
  const out = {};
  for (const unit of DURATION_UNITS) {
    const n = Number(values?.[unit.key] ?? 0);
    out[`${prefix}${unit.key}`] = n || undefined;
  }
  out.excludeDays = values?.excludeDays?.length > 0 ? values.excludeDays : undefined;
  return out;
}

/** True when nothing at all was entered. */
export function isDurationEmpty(values) {
  return DURATION_UNITS.every((unit) => !Number(values?.[unit.key] ?? 0));
}

/**
 * The four ways a duration can be refused.
 *
 * Deliberately shared: the engine applies the same rules to a delay and a
 * deadline, so the front end should refuse them in the same words.
 *
 * @param {Object} source the step or deadline as stored
 * @param {'delay'|'after'} prefix
 * @param {string} where human description of what is wrong, e.g. `"Cooling off"`
 * @returns {string[]}
 */
export function validateDuration(source, prefix, where, { required = true } = {}) {
  const errors = [];
  const values = readDuration(source, prefix);

  if (DURATION_UNITS.some((unit) => Number(values[unit.key]) < 0)) {
    errors.push(`${where} waits for less than no time.`);
  } else if (isDurationEmpty(values)) {
    // A `humanTask` due date is optional — no date simply means the task never
    // becomes overdue — so an empty one is only wrong where something is
    // required, which a delay and a deadline both are.
    if (required) errors.push(`${where} says how long to wait nowhere.`);
    return errors;
  }

  const excluded = values.excludeDays ?? [];
  const unknown = excluded.filter((day) => !WEEKDAY_NAMES.includes(day));
  for (const day of unknown) {
    errors.push(`${where} excludes '${day}', which is not a day. Days: ${WEEKDAY_NAMES.join(', ')}.`);
  }

  if (unknown.length === 0 && excluded.length === WEEKDAY_NAMES.length) {
    errors.push(`${where} excludes every day of the week, so its time would never come.`);
  }

  return errors;
}

const UNIT_WORDS = {
  Years: ['year', 'years'],
  Months: ['month', 'months'],
  Days: ['day', 'days'],
  Hours: ['hour', 'hours'],
  Minutes: ['minute', 'minutes'],
};

/**
 * "1 month, 3 days and 4 hours, skipping Fri and Sat" — for a collapsed step
 * header, where the whole point is not having to open the editor.
 *
 * @param {Object} source
 * @param {'delay'|'after'} prefix
 * @returns {string|null} null when nothing is set
 */
export function describeDuration(source, prefix) {
  const values = readDuration(source, prefix);
  if (isDurationEmpty(values)) return null;

  const parts = DURATION_UNITS.filter((unit) => Number(values[unit.key]))
    .map((unit) => {
      const n = Number(values[unit.key]);
      const [one, many] = UNIT_WORDS[unit.key];
      return `${n} ${n === 1 ? one : many}`;
    });

  const duration =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;

  const excluded = values.excludeDays ?? [];
  if (excluded.length === 0) return duration;

  const days = excluded
    .filter((d) => WEEKDAY_NAMES.includes(d))
    .map((d) => d.slice(0, 1).toUpperCase() + d.slice(1, 3));

  return days.length > 0 ? `${duration}, skipping ${days.join(' and ')}` : duration;
}
