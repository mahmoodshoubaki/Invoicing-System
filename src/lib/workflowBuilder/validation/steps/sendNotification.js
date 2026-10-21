import { isEmailOrPlaceholder } from '@/lib/workflowNotifications';
import { readPlaceholder } from '@/utils/workflowPlaceholder';

/** A Send notification step's rules: its type, its recipients, its CC, and the task it is about. */

const TO_LISTS = ['toUserIds', 'toRoleIds', 'toExpressions', 'toEmails'];
const CC_LISTS = ['ccUserIds', 'ccRoleIds', 'ccExpressions', 'ccEmails'];

/** Whether the step copies anybody in — people, roles, person fields or addresses. */
export function copiesAnyone(step) {
  return CC_LISTS.some((k) => (step?.[k] ?? []).length > 0);
}

/**
 * The two CC boxes, as the server judges them. A step saved before the boxes
 * existed has no `ccGetsEmail`, which means true.
 */
export function ccDeliveryProblems(step) {
  const email = step?.ccGetsEmail !== false;
  const inApp = step?.ccGetsInApp === true;
  const problems = [];
  if (copiesAnyone(step) && !email && !inApp) {
    problems.push('copies people in, but sends them neither the email nor the in-app notification.');
  }
  if ((step?.ccEmails ?? []).length > 0 && inApp && !email) {
    problems.push('copies email addresses in, but only in-app, and an address can only get the email.');
  }
  return problems;
}

/** `{{field}}` recipients: each must be a `{{name}}`, and a known one must hold a person (WF-038). */
function checkExpressions(expressions, { where, fields, errors, line }) {
  for (const expression of expressions ?? []) {
    const parsed = readPlaceholder(expression);
    if (parsed.kind !== 'name') {
      errors.push(`${where} has a ${line} entry that is not a {{name}}.`);
      continue;
    }
    const field = fields.find((f) => f.name === parsed.name);
    if (field && field.isUser !== true) {
      errors.push(`${where} ${line === 'CC' ? 'copies in' : 'sends to'} "${field.label}", which does not hold a person.`);
    }
  }
}

/*
 * Tells people, then walks on (2026-10-07; CC like To, 2026-10-08). The save
 * refuses each of these with the server's own words; checked here so nobody
 * learns them that way. Placeholder values are never refused.
 */
export function checkSendNotification(step, { where, fields, humanTaskIds, notificationTypeKeys, errors }) {
  if (step.notificationTypeKey == null) {
    errors.push(`${where} sends a notification without saying which type.`);
  } else if (notificationTypeKeys && !notificationTypeKeys.has(step.notificationTypeKey)) {
    // WF-050.
    errors.push(`${where} sends notification type ${step.notificationTypeKey}, which does not exist or was deleted.`);
  }

  const toLists = TO_LISTS.map((k) => step[k] ?? []);
  if (toLists.every((l) => l.length === 0)) {
    errors.push(`${where} sends a notification to nobody. Pick people, roles, a person field or an address.`);
  }

  const everyEntry = [...toLists.flat(), ...CC_LISTS.flatMap((k) => step[k] ?? [])];
  if (everyEntry.some((v) => !String(v ?? '').trim())) {
    errors.push(`${where} has an empty recipient.`);
  }

  for (const problem of ccDeliveryProblems(step)) errors.push(`${where} ${problem}`);

  for (const address of [...(step.toEmails ?? []), ...(step.ccEmails ?? [])]) {
    if (String(address ?? '').trim() && !isEmailOrPlaceholder(address)) {
      errors.push(`${where}: "${address}" is not an email address.`);
    }
  }

  checkExpressions(step.toExpressions, { where, fields, errors, line: 'recipient' });
  checkExpressions(step.ccExpressions, { where, fields, errors, line: 'CC' });

  // Only checkable when the caller knows the workflow's tasks — a step
  // validated alone passes an empty set and must not report every link.
  if (step.taskStepId && humanTaskIds.size > 0 && !humanTaskIds.has(step.taskStepId)) {
    errors.push(`${where} is about "${step.taskStepId}", which is not a human task in this workflow.`);
  }
}
