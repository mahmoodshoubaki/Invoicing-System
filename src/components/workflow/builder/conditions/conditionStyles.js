export const EMPTY = [];

export function someField(group, fields, test) {
  if (!group) return false;
  const hit = (group.conditions ?? []).some((c) => test(fields.find((f) => f.name === c.field)));
  return hit || (group.groups ?? []).some((g) => someField(g, fields, test));
}

export const GROUP_LABELS = {
  record: 'This record',
  variable: 'Workflow variables',
  outcome: 'Step answers',
  item: 'The item this loop is on',
};

export const controlClass =
  'rounded-md border border-gray-200 bg-white px-2 py-1 text-xs outline-none focus:border-primary';

const RAIL_COLORS = ['#c9c7bf', '#a9a69c', '#8b877c'];

export const railColor = (depth) => RAIL_COLORS[Math.min(depth, RAIL_COLORS.length - 1)];
