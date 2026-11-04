import { isDurationEmpty, readDuration, validateDuration } from '@/utils/workflowDuration';
import { readPlaceholder } from '@/utils/workflowPlaceholder';
import { reasonsListProblems } from '@/lib/taskReasons';

import { unknownTypeErrors } from '../notificationTypes';

function checkTaskFields(step, { where, fields, taskFields, errors }) {
  const asked = step.fields ?? [];
  if (asked.length === 0) return;

  const catalog = taskFields ?? (fields ?? []).filter((f) => (f.source ?? 'record') === 'record');
  const names = asked.map((f) => f?.name ?? '');

  if (names.some((n) => !n.trim())) errors.push(`${where} has a field to fill with no name.`);
  if (new Set(names).size !== names.length) errors.push(`${where} lists the same field to fill twice.`);

  for (const name of names.filter(Boolean)) {
    const field = catalog.find((f) => f.name === name);
    if (!field) continue;
    if (!field.fillable) errors.push(`${where} asks for "${field.label}", which a task cannot fill.`);
    for (const partner of field.mustBeAskedWith ?? []) {
      if (!names.includes(partner)) {
        const partnerLabel = catalog.find((f) => f.name === partner)?.label ?? partner;
        errors.push(`${where} asks for "${field.label}", which has to be asked for together with "${partnerLabel}".`);
      }
    }
  }

  if (!(step.outcomes ?? []).some((o) => o.requiresFields)) {
    errors.push(`${where} has fields to fill, but no button saves them. Tick "Saves the fields" on one.`);
  }
}

export function checkHumanTask(step, { where, fields, taskFields, stageIds, notificationTypeKeys, errors }) {
  const expressions = step.assignToExpressions ?? [];
  const assignees =
    (step.assignToUserIds?.length ?? 0) + (step.assignToRoleIds?.length ?? 0) + (step.assignToGroupIds?.length ?? 0) + expressions.length;
  if (assignees === 0) errors.push(`${where} is not assigned to anyone, so nobody could ever answer it.`);

  for (const expression of expressions) {
    const parsed = readPlaceholder(expression);

    if (parsed.kind === 'literal') {
      errors.push(`${where} has an assignee entry that is not a {{name}}.`);
      continue;
    }
    if (parsed.kind === 'secret' || parsed.kind === 'malformed') {
      errors.push(`${where} has an assignee entry that is not a name the run can answer.`);
      continue;
    }
    if (parsed.kind === 'builtin') {
      errors.push(`${where} assigns a task to "${parsed.name}", which is a date, not a person.`);
      continue;
    }

    const field = fields.find((f) => f.name === parsed.name);
    if (field && field.isUser !== true) {
      errors.push(`${where} assigns a task to "${field.label}", which does not hold a person.`);
    }
  }

  const outcomes = step.outcomes ?? [];
  if (outcomes.length === 0) errors.push(`${where} has no outcomes, so there would be no buttons to press.`);

  const keys = outcomes.map((o) => o.key);
  if (new Set(keys).size !== keys.length) errors.push(`${where} has two outcomes sharing a key.`);
  if (outcomes.some((o) => !o.key?.trim())) errors.push(`${where} has an outcome with no key.`);
  for (const outcome of outcomes.filter((o) => o.reasons)) {
    for (const problem of reasonsListProblems(outcome.reasons)) {
      errors.push(`${where}, button "${outcome.label || outcome.key}", ${problem}.`);
    }
  }

  checkTaskFields(step, { where, fields, taskFields, errors });

  errors.push(...validateDuration(step, 'dueIn', where, { required: false }));

  const reminder = step.notifications?.reminder;
  if (reminder) {
    if (isDurationEmpty(readDuration(step, 'dueIn'))) {
      errors.push(`${where} sends a reminder before it is due, but has no due date.`);
    }
    const parts = [reminder.beforeDueDays, reminder.beforeDueHours, reminder.repeatEveryDays, reminder.repeatEveryHours];
    if (parts.some((n) => n != null && n < 0)) {
      errors.push(`${where} has a reminder with a negative time.`);
    }
    if (reminder.repeat && (reminder.repeatEveryDays || 0) + (reminder.repeatEveryHours || 0) <= 0) {
      errors.push(`${where} repeats its reminder, but every zero days and zero hours.`);
    }
  }
  errors.push(...unknownTypeErrors(step.notifications, where, notificationTypeKeys));

  if (step.overdue?.toStageId != null || step.overdue?.comeBack) {
    if (isDurationEmpty(readDuration(step, 'dueIn'))) {
      errors.push(`${where} escalates when nobody answers, but has no due date — so it could never be overdue.`);
    }
    if (!step.overdue?.toStageId) {
      errors.push(`${where} escalates when nobody answers, but has nowhere to escalate to.`);
    } else if (stageIds.size > 0 && !stageIds.has(step.overdue.toStageId)) {
      errors.push(`${where} escalates to a stage that no longer exists.`);
    }
  }
}
