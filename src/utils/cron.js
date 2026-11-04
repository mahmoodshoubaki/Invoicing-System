export const WEEKDAYS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export const WORKING_DAYS_CRON = '0-4';

export const CRON_FREQUENCY = {
  DAILY: 'daily',
  WORKING_DAYS: 'workingDays',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
};

const pad = (n) => String(n).padStart(2, '0');

export function formatTime(hour, minute) {
  return `${pad(hour)}:${pad(minute)}`;
}

/**
 * @param {Object} parts
 * @param {string} parts.frequency
 * @param {number} [parts.hour]
 * @param {number} [parts.minute]
 * @param {number} [parts.weekday]
 * @param {number} [parts.monthDay]
 * @returns {string}
 */
export function buildCron({ frequency, hour = 9, minute = 0, weekday = 1, monthDay = 1 }) {
  switch (frequency) {
    case CRON_FREQUENCY.DAILY:
      return `${minute} ${hour} * * *`;
    case CRON_FREQUENCY.WORKING_DAYS:
      return `${minute} ${hour} * * ${WORKING_DAYS_CRON}`;
    case CRON_FREQUENCY.WEEKLY:
      return `${minute} ${hour} * * ${weekday}`;
    case CRON_FREQUENCY.MONTHLY:
      return `${minute} ${hour} ${monthDay} * *`;
    default:
      return '';
  }
}

/**
 * @param {string} expression
 * @returns {{frequency: string, hour: number, minute: number, weekday: number, monthDay: number}}
 */
export function parseCron(expression) {
  const fallback = { frequency: CRON_FREQUENCY.CUSTOM, hour: 9, minute: 0, weekday: 1, monthDay: 1 };

  const parts = String(expression ?? '').trim().split(/\s+/);
  if (parts.length !== 5) return fallback;

  const [min, hr, dom, mon, dow] = parts;

  const isNumber = (v) => /^\d+$/.test(v);
  if (!isNumber(min) || !isNumber(hr) || mon !== '*') return fallback;

  const minute = Number(min);
  const hour = Number(hr);
  if (minute > 59 || hour > 23) return fallback;

  const base = { ...fallback, hour, minute };

  if (dom === '*' && dow === '*') return { ...base, frequency: CRON_FREQUENCY.DAILY };
  if (dom === '*' && dow === WORKING_DAYS_CRON) return { ...base, frequency: CRON_FREQUENCY.WORKING_DAYS };
  if (dom === '*' && isNumber(dow) && Number(dow) <= 6) {
    return { ...base, frequency: CRON_FREQUENCY.WEEKLY, weekday: Number(dow) };
  }
  if (dow === '*' && isNumber(dom) && Number(dom) >= 1 && Number(dom) <= 31) {
    return { ...base, frequency: CRON_FREQUENCY.MONTHLY, monthDay: Number(dom) };
  }

  return base;
}

const ORDINAL_SUFFIX = (n) => {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  return { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th';
};

/**
 * @param {string} expression
 * @returns {string|null}
 */
export function describeCron(expression) {
  const parts = String(expression ?? '').trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const [min, hr, dom, mon, dow] = parts;
  if (hr === '*' && dom === '*' && mon === '*' && dow === '*') {
    if (min === '*') return 'Every minute';
    const step = /^\*\/(\d+)$/.exec(min);
    if (step) return `Every ${step[1]} minutes`;
    if (/^\d+$/.test(min) && Number(min) <= 59) return Number(min) === 0 ? 'Every hour, on the hour' : `Every hour at ${min} minutes past`;
  }

  const parsed = parseCron(expression);
  const time = formatTime(parsed.hour, parsed.minute);

  switch (parsed.frequency) {
    case CRON_FREQUENCY.DAILY:
      return `Every day at ${time}`;
    case CRON_FREQUENCY.WORKING_DAYS:
      return `Every working day (Sunday to Thursday) at ${time}`;
    case CRON_FREQUENCY.WEEKLY:
      return `Every ${WEEKDAYS[parsed.weekday].label} at ${time}`;
    case CRON_FREQUENCY.MONTHLY:
      return `The ${parsed.monthDay}${ORDINAL_SUFFIX(parsed.monthDay)} of every month at ${time}`;
    default:
      return null;
  }
}

/**
 * @param {string} expression
 * @returns {boolean}
 */
export function looksLikeCron(expression) {
  const parts = String(expression ?? '').trim().split(/\s+/);
  return parts.length === 5 && parts.every((p) => /^[0-9*,\-/]+$/.test(p));
}
