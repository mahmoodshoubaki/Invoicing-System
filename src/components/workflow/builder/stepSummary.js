/**
 * A one-line description of what a step will do, for its card on the canvas.
 *
 * A stage of steps should read as a sequence, so each line says something
 * specific rather than repeating its own type name. With every setting in the
 * side panel, this line is the canvas's whole account of the step.
 */

import { describeFilterGroup } from '@/lib/filterDescription';
import { describeDuration } from '@/utils/workflowDuration';
import { readPlaceholder } from '@/utils/workflowPlaceholder';
import { HTTP_CALL_ACTION, STEP_TYPE, STEP_TYPE_INFO, TARGET_TYPE_LABELS } from '@/constants/workflow';

const count = (list) => (list ?? []).length;

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function summariseStep(step, ctx) {
  const { roles, resolvedById, actions, fields, notificationTypes } = ctx;

  switch (step.type) {
    case STEP_TYPE.HUMAN_TASK: {
      const names = [
        ...(step.assignToRoleIds ?? []).map((id) => roles.find((r) => r.id === id)?.name),
        ...(step.assignToUserIds ?? []).map((id) => resolvedById[id]?.displayName),
        // `{{approver}}`, `{{submittedBy}}` — named by what holds the person.
        ...(step.assignToExpressions ?? []).map((expression) => {
          const name = readPlaceholder(expression).name;
          return fields.find((f) => f.name === name)?.label ?? name;
        }),
      ].filter(Boolean);
      const who = names.length > 0 ? names.join(', ') : 'nobody yet';
      const fills = count(step.fields) > 0 ? ` · fills ${plural(count(step.fields), 'field')}` : '';
      return `${who} · ${plural(count(step.outcomes), 'outcome')}${fills}`;
    }

    case STEP_TYPE.AUTOMATED: {
      if (!step.action) return 'no action chosen';
      if (step.action === HTTP_CALL_ACTION) {
        const method = step.inputs?.method ?? 'GET';
        return step.inputs?.url ? `${method} ${step.inputs.url}` : `${method} — no address`;
      }
      return actions.find((a) => a.key === step.action)?.label ?? step.action;
    }

    case STEP_TYPE.DELAY: {
      const spelled = describeDuration(step, 'delay');
      return spelled ? `waits ${spelled}` : 'no duration set';
    }

    case STEP_TYPE.BRANCH:
      return `if ${describeFilterGroup(step.condition, fields, 2)}`;

    case STEP_TYPE.FOR_EACH:
      return step.source ? `each ${step.itemName || 'item'} in ${step.source}` : 'no list chosen';

    case STEP_TYPE.REPEAT:
      return step.times != null
        ? plural(step.times, 'time')
        : `until ${describeFilterGroup(step.until, fields, 2)}`;

    case STEP_TYPE.QUERY:
      return step.into
        ? `${TARGET_TYPE_LABELS[step.targetTypeKey] ?? '?'} → ${step.into}`
        : 'no variable chosen';

    case STEP_TYPE.SEND_NOTIFICATION: {
      const type = notificationTypes?.find((t) => t.key === step.notificationTypeKey);
      const what = type?.englishName ?? (step.notificationTypeKey != null ? `type ${step.notificationTypeKey}` : 'no type chosen');
      const to = count(step.toUserIds) + count(step.toRoleIds) + count(step.toExpressions) + count(step.toEmails);
      const cc = count(step.ccUserIds) + count(step.ccRoleIds) + count(step.ccExpressions) + count(step.ccEmails);
      const recipients = to === 0 ? 'nobody yet' : plural(to, 'recipient');
      return `${what} → ${recipients}${cc > 0 ? ` · ${cc} in CC` : ''}`;
    }

    case STEP_TYPE.SET_VARIABLE:
      if (!step.name) return 'no variable chosen';
      return step.value === '' ? `clears ${step.name}` : `${step.name} = ${step.value}`;

    case STEP_TYPE.PARALLEL: {
      const n = count(step.branches);
      const early = step.joinWhen ? ', can stop early' : '';
      return `${n} branch${n === 1 ? '' : 'es'}${early}`;
    }

    default:
      return STEP_TYPE_INFO[step.type]?.label ?? step.type;
  }
}
