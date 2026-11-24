const DELETED_KEY = { 1: 'deletedAccount', 2: 'deletedRole', 3: 'deletedGroup' };

/**
 * @param {Object} assignee
 * @param {(key: string) => string} t translator for the `workflowProgress` namespace
 */
export const assigneeName = (assignee, t) =>
  assignee?.name || t(DELETED_KEY[assignee?.assigneeTypeKey] ?? DELETED_KEY[1]);

export function assigneeNames(assignees, t, locale) {
  const list = (assignees ?? []).map((assignee) => assigneeName(assignee, t));
  if (list.length === 0) return t('nobodyYet');
  return new Intl.ListFormat(locale, { type: 'conjunction' }).format(list);
}

/**
 * @param {Array|null} waitingOn
 * @param {(key: string) => string} t translator for the `workflowProgress` namespace
 * @param {string} locale
 */
export function waitingOnText(waitingOn, t, locale) {
  const parts = (waitingOn ?? []).map((task) => `${assigneeNames(task.assignees, t, locale)} (${task.taskTitle || t('aTask')})`);
  return parts.length ? parts.join(t('separator')) : null;
}
