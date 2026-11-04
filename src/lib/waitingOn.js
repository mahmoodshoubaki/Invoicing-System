const DELETED = { 1: 'a deleted account', 2: 'a deleted role', 3: 'a deleted group' };

export const assigneeName = (assignee) =>
  assignee?.name || DELETED[assignee?.assigneeTypeKey] || DELETED[1];

export function assigneeNames(assignees) {
  const list = (assignees ?? []).map(assigneeName);
  if (list.length === 0) return 'nobody yet';
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`;
}

export function waitingOnText(waitingOn) {
  const parts = (waitingOn ?? []).map((task) => `${assigneeNames(task.assignees)} (${task.taskTitle || 'a task'})`);
  return parts.length ? parts.join('; ') : null;
}
