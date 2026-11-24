import { formatDate } from '@/utils/formatters';

const ABOUT_ITEM = /^'(.+?)'( \(new item\))?(?::\s*|\s+)([\s\S]*)$/;
const LATE_CYCLE = /^plan cycle (\d+) on (\d{4}-\d{2}-\d{2}) would be after the new contract finish date \((\d{4}-\d{2}-\d{2})\)\.?$/i;
const NO_CYCLE = /^would have no invoicing plan cycle left\.?$/i;
const ISO_DAY = /\b(\d{4}-\d{2}-\d{2})(?:T[\d:.]+)?\b/g;

function lateLine(cycles, finish, t, locale) {
  const day = (value) => formatDate(value, locale);
  const days = cycles.map((c) => c.date).sort();
  const end = day(finish);
  if (cycles.length === 1) return t('lateOne', { number: cycles[0].number, date: day(days[0]), finish: end });
  const numbers = new Intl.ListFormat(locale, { type: 'conjunction' }).format(cycles.map((c) => String(c.number)));
  if (days[0] === days.at(-1)) return t('lateManySameDay', { numbers, date: day(days[0]), finish: end });
  return t('lateMany', { numbers, from: day(days[0]), to: day(days.at(-1)), finish: end });
}

/**
 * @param {string[]} messages
 * @param {{ inRequest?: string[], t: (key: string, values?: Object) => string, locale: string }} options t is the `changeRequests.problems` translator
 * @returns {{ general: string[], items: Array<{ name: string, inRequest: boolean, lines: string[], hint: string|null }>, count: number }}
 */
export function groupProblems(messages, { inRequest = [], t, locale }) {
  const withDates = (text) => text.replace(ISO_DAY, (_, day) => formatDate(day, locale) || day);
  const names = new Set(inRequest);
  const general = [];
  const byItem = new Map();
  const itemOf = (name) => {
    if (!byItem.has(name)) byItem.set(name, { lines: [], late: [], finish: null, noCycle: false });
    return byItem.get(name);
  };

  for (const message of messages ?? []) {
    const text = String(message ?? '').trim();
    if (!text) continue;
    const about = ABOUT_ITEM.exec(text);
    if (!about) {
      general.push(withDates(text));
      continue;
    }
    const item = itemOf(about[2] ? `${about[1]} (new item)` : about[1]);
    const rest = about[3].trim();
    const late = LATE_CYCLE.exec(rest);
    if (late) {
      item.late.push({ number: Number(late[1]), date: late[2] });
      item.finish = late[3];
    } else if (NO_CYCLE.test(rest)) {
      item.noCycle = true;
    } else {
      item.lines.push(withDates(`${rest.charAt(0).toUpperCase()}${rest.slice(1)}`));
    }
  }

  const items = [...byItem.entries()].map(([name, found]) => {
    const isIn = names.has(name);
    const lines = [...found.lines];
    let hint = null;
    if (found.noCycle) lines.unshift(t('noCycleLeft'));
    if (found.late.length) {
      lines.push(lateLine(found.late.sort((a, b) => a.number - b.number), found.finish, t, locale));
      hint = isIn ? t('lateHintIn') : t('lateHintOut');
    }
    return { name, inRequest: isIn, lines, hint };
  });

  const count = general.length + items.reduce((n, i) => n + i.lines.length, 0);
  return { general, items, count };
}
