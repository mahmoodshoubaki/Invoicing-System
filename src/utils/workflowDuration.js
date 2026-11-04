import { DURATION_UNITS, WEEKDAY_NAMES } from '@/constants/workflow';

/**
 * @param {Object} source
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
 * @param {Object} values
 * @param {'delay'|'after'} prefix
 * @returns {Object}
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
 * @param {Object} values
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

export function isDurationEmpty(values) {
  return DURATION_UNITS.every((unit) => !Number(values?.[unit.key] ?? 0));
}

/**
 * @param {Object} source
 * @param {'delay'|'after'} prefix
 * @param {string} where
 * @returns {string[]}
 */
export function validateDuration(source, prefix, where, { required = true } = {}) {
  const errors = [];
  const values = readDuration(source, prefix);

  if (DURATION_UNITS.some((unit) => Number(values[unit.key]) < 0)) {
    errors.push(`${where} waits for less than no time.`);
  } else if (isDurationEmpty(values)) {
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
 * @param {Object} source
 * @param {'delay'|'after'} prefix
 * @returns {string|null}
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
