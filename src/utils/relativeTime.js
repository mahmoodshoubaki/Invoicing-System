/**
 * @param {number} s absolute seconds, 45 or more
 * @returns {[number, 'minute'|'hour'|'day'|'month'|'year']}
 */
function relativeUnit(s) {
  if (s < 3600) return [Math.max(1, Math.round(s / 60)), 'minute'];
  if (s < 86400) return [Math.round(s / 3600), 'hour'];
  const days = Math.round(s / 86400);
  if (days < 30) return [days, 'day'];
  if (days < 365) return [Math.round(days / 30), 'month'];
  return [Math.round(days / 365), 'year'];
}

const ENGLISH_UNIT = { minute: 'min', hour: 'hour', day: 'day', month: 'month', year: 'year' };

function englishRelative(s, future) {
  if (s < 45) return future ? 'in a moment' : 'just now';
  const [n, unit] = relativeUnit(s);
  if (unit === 'day' && n === 1) return future ? 'tomorrow' : 'yesterday';
  const text = `${n} ${ENGLISH_UNIT[unit]}${n === 1 ? '' : 's'}`;
  return future ? `in ${text}` : `${text} ago`;
}

function intlRelative(s, future, locale) {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (s < 45) return format.format(0, 'second');
  const [n, unit] = relativeUnit(s);
  return format.format(future ? n : -n, unit);
}

/**
 * @param {string|Date|null} value
 * @param {number} [now]
 * @param {string|null} [locale] non-English locales use Intl.RelativeTimeFormat
 */
export function relativeTime(value, now = Date.now(), locale = null) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.round((now - then) / 1000);
  const future = seconds < 0;
  const s = Math.abs(seconds);

  return locale && !locale.startsWith('en') ? intlRelative(s, future, locale) : englishRelative(s, future);
}
