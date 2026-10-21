import { isDurationEmpty, readDuration, validateDuration } from '@/utils/workflowDuration';
import { readPlaceholder } from '@/utils/workflowPlaceholder';

import { unknownTypeErrors } from '../notificationTypes';

/** A human task's rules: who answers, what they can answer, when it is due, and what happens if nobody does. */

/**
 * The fields a task asks its holder to fill (2026-10-11) — the server's WF-055,
 * checked here first: none may be listed twice, a listed field must be one a
 * task can fill, fields that go together must be asked together, and some
 * button must save them.
 *
 * A name the list does not have is NOT a problem (2026-10-13): an admin can
 * switch a field Off in Workflow fields, and a workflow already asking for it
 * still runs and publishes. `taskFields` is the record's whole list (an
 * invoicing plan included); without it, the condition catalog's record fields
 * stand in.
 */
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
    (step.assignToUserIds?.length ?? 0) + (step.assignToRoleIds?.length ?? 0) + expressions.length;
  if (assignees === 0) errors.push(`${where} is not assigned to anyone, so nobody could ever answer it.`);

  /*
   * An expression naming a field must name one that holds a person — WF-038.
   *
   * A name the catalog does NOT know is left alone on purpose: it is a
   * workflow variable or a loop item, and whether it holds a user can only
   * be answered while the run is going. Refusing it here would block the
   * legitimate case of stashing a guid in a variable.
   */
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

  checkTaskFields(step, { where, fields, taskFields, errors });

  // The due date is optional — a task with none simply never becomes
  // overdue — so only the negative and excluded-day rules apply here.
  errors.push(...validateDuration(step, 'dueIn', where, { required: false }));

  // The notification checkboxes (2026-10-07). A reminder counts back from
  // the due date, so it needs one, and a repeating one needs a period.
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
      // Only checkable when the caller knows the stages. A step editor
      // validating one step in isolation passes an empty set, and must not
      // report every escalation as dangling for want of the list.
      errors.push(`${where} escalates to a stage that no longer exists.`);
    }
  }
}
