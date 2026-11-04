/** The years the dashboard offers: the last five and this one. */
export function yearOptions(now = new Date()) {
  const thisYear = now.getFullYear();
  return Array.from({ length: 6 }, (_, i) => thisYear - 5 + i);
}

/** The last month that can be picked in `year`. */
export function lastMonthOf(year, now = new Date()) {
  return year >= now.getFullYear() ? now.getMonth() + 1 : 12;
}

/** Keeps a picked month from running past this one. */
export function clampPeriod({ month, year }, now = new Date()) {
  const y = Math.min(year, now.getFullYear());
  return { year: y, month: Math.min(month, lastMonthOf(y, now)) };
}
