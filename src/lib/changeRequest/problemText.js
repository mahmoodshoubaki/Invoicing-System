import { formatDate } from '@/utils/formatters';

const ABOUT_ITEM = /^'(.+?)'( \(new item\))?(?::\s*|\s+)([\s\S]*)$/;
const LATE_CYCLE = /^plan cycle (\d+) on (\d{4}-\d{2}-\d{2}) would be after the new contract finish date \((\d{4}-\d{2}-\d{2})\)\.?$/i;
const NO_CYCLE = /^would have no invoicing plan cycle left\.?$/i;
const ISO_DAY = /\b(\d{4}-\d{2}-\d{2})(?:T[\d:.]+)?\b/g;

const withDates = (text) => text.replace(ISO_DAY, (_, day) => formatDate(day) || day);

function listOf(numbers) {
  if (numbers.length <= 1) return numbers.join('');
  return `${numbers.slice(0, -1).join(', ')} and ${numbers.at(-1)}`;
}

function lateLine(cycles, finish) {
  const days = cycles.map((c) => c.date).sort();
  const when = days.length === 1
    ? `on ${formatDate(days[0])}`
    : `(${formatDate(days[0])} to ${formatDate(days.at(-1))})`;
  const which = cycles.length === 1 ? `Cycle ${cycles[0].number}` : `Cycles ${listOf(cycles.map((c) => c.number))}`;
  return `${which} ${when} would fall after the new contract end date, ${formatDate(finish)}.`;
}

/**
 * @param {string[]} messages
 * @param {{ inRequest?: string[] }} [options]
 * @returns {{ general: string[], items: Array<{ name: string, inRequest: boolean, lines: string[], hint: string|null }>, count: number }}
 */
export function groupProblems(messages, { inRequest = [] } = {}) {
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
    if (found.noCycle) lines.unshift('No invoicing plan cycle would be left — keep at least one.');
    if (found.late.length) {
      lines.push(lateLine(found.late.sort((a, b) => a.number - b.number), found.finish));
      hint = isIn
        ? 'Move or remove those cycles in its invoicing plan, or keep a later contract end date.'
        : 'It is not in this request: add it, then move or remove those cycles — or keep a later contract end date.';
    }
    return { name, inRequest: isIn, lines, hint };
  });

  const count = general.length + items.reduce((n, i) => n + i.lines.length, 0);
  return { general, items, count };
}
