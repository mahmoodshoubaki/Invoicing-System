/**
 * "5 min ago", "yesterday", "3 days ago" — for lists where WHEN matters more as
 * a distance than as a date. The exact time always goes in a tooltip beside it.
 *
 * `now` is a parameter, not read inside, so a list can pass one clock for
 * every row and re-render them together rather than each drifting.
 *
 * @param {string|Date|null} value
 * @param {number} [now]
 */
export function relativeTime(value, now = Date.now()) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.round((now - then) / 1000);
  const future = seconds < 0;
  const s = Math.abs(seconds);

  const say = (n, unit) => {
    const text = `${n} ${unit}${n === 1 ? '' : 's'}`;
    return future ? `in ${text}` : `${text} ago`;
  };

  if (s < 45) return future ? 'in a moment' : 'just now';
  if (s < 3600) return say(Math.max(1, Math.round(s / 60)), 'min');
  if (s < 86400) return say(Math.round(s / 3600), 'hour');
  const days = Math.round(s / 86400);
  if (days === 1) return future ? 'tomorrow' : 'yesterday';
  if (days < 30) return say(days, 'day');
  if (days < 365) return say(Math.round(days / 30), 'month');
  return say(Math.round(days / 365), 'year');
}
