/**
 * Who a record's workflow is waiting on, said one way everywhere (2026-10-21):
 * "Waiting on: Sara Khalil (BU Head Approval)". Several holders are listed,
 * several to-dos joined with "; ". A deleted account or role still counts —
 * it is said as one rather than dropped.
 */

const DELETED = { 1: 'a deleted account', 2: 'a deleted role', 3: 'a deleted group' };

/** One holder's name, or what they were. */
export const assigneeName = (assignee) =>
  assignee?.name || DELETED[assignee?.assigneeTypeKey] || DELETED[1];

/** "Sara Khalil", "Sara and Mona", "Sara, Mona and Karim" — or "nobody yet". */
export function assigneeNames(assignees) {
  const list = (assignees ?? []).map(assigneeName);
  if (list.length === 0) return 'nobody yet';
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`;
}

/** "Sara Khalil (BU Head Approval); Invoicing team (Enter details)" — or null when it waits on nothing. */
export function waitingOnText(waitingOn) {
  const parts = (waitingOn ?? []).map((task) => `${assigneeNames(task.assignees)} (${task.taskTitle || 'a task'})`);
  return parts.length ? parts.join('; ') : null;
}
