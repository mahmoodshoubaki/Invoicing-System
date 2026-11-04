import { isEmailOrPlaceholder } from '@/lib/workflowNotifications';
import { readPlaceholder } from '@/utils/workflowPlaceholder';

const TO_LISTS = ['toUserIds', 'toRoleIds', 'toGroupIds', 'toExpressions', 'toEmails'];
const CC_LISTS = ['ccUserIds', 'ccRoleIds', 'ccGroupIds', 'ccExpressions', 'ccEmails'];

export function copiesAnyone(step) {
  return CC_LISTS.some((k) => (step?.[k] ?? []).length > 0);
}

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

export function checkSendNotification(step, { where, fields, humanTaskIds, notificationTypeKeys, errors }) {
  if (step.notificationTypeKey == null) {
    errors.push(`${where} sends a notification without saying which type.`);
  } else if (notificationTypeKeys && !notificationTypeKeys.has(step.notificationTypeKey)) {
    errors.push(`${where} sends notification type ${step.notificationTypeKey}, which does not exist or was deleted.`);
  }

  const toLists = TO_LISTS.map((k) => step[k] ?? []);
  if (toLists.every((l) => l.length === 0)) {
    errors.push(`${where} sends a notification to nobody. Pick people, roles, groups, a person field or an address.`);
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

  if (step.taskStepId && humanTaskIds.size > 0 && !humanTaskIds.has(step.taskStepId)) {
    errors.push(`${where} is about "${step.taskStepId}", which is not a human task in this workflow.`);
  }
}
