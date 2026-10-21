/** Shared bits of the condition editor: its look per nesting level, and small lookups. */

/** Shared empty array so an absent list keeps a stable identity across renders. */
export const EMPTY = [];

/** True when any condition in the group, at any depth, names a field that passes `test`. */
export function someField(group, fields, test) {
  if (!group) return false;
  const hit = (group.conditions ?? []).some((c) => test(fields.find((f) => f.name === c.field)));
  return hit || (group.groups ?? []).some((g) => someField(g, fields, test));
}

/** Where a field comes from — the module, the workflow, or a step's answer. */
export const GROUP_LABELS = {
  record: 'This record',
  variable: 'Workflow variables',
  outcome: 'Step answers',
  item: 'The item this loop is on',
};

export const controlClass =
  'rounded-md border border-gray-200 bg-white px-2 py-1 text-xs outline-none focus:border-primary';

/** The rail colour deepens with nesting so each level is distinguishable. */
const RAIL_COLORS = ['#c9c7bf', '#a9a69c', '#8b877c'];

export const railColor = (depth) => RAIL_COLORS[Math.min(depth, RAIL_COLORS.length - 1)];
