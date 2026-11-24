/**
 * @returns {{ month: number, year: number }} the month before the current one; January gives December of last year.
 */
export function previousMonth(now = new Date()) {
  const date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

export function yearOptions(now = new Date()) {
  const latestYear = previousMonth(now).year;
  return Array.from({ length: 6 }, (_, i) => latestYear - 5 + i);
}

export function lastMonthOf(year, now = new Date()) {
  const latest = previousMonth(now);
  return year >= latest.year ? latest.month : 12;
}

export function clampPeriod({ month, year }, now = new Date()) {
  const y = Math.min(year, previousMonth(now).year);
  return { year: y, month: Math.min(month, lastMonthOf(y, now)) };
}
