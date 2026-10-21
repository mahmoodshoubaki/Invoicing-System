'use client';

import { memo, useMemo } from 'react';

import { controlClass, Label, Note } from '@/components/workflow/builder/containers/shared';
import NotificationTypeSelect from '@/components/workflow/builder/NotificationTypeSelect';
import { TASK_VALUE_NAMES } from '@/lib/workflowNotifications';
import PlaceholderValues from './PlaceholderValues';
import { sendStepTokens } from './notificationTokens';

/**
 * A Send notification step's Message tab: which type to send, values for its
 * words, and the task it is about.
 *
 * Pointing it at a human task lets the words use that task's details — the
 * escalation stage of an approval saying "Approve INV-0042 was due Monday and
 * Sara did not answer".
 *
 * @param {{ step: Object, ctx: Object, onChange: (patch: Object) => void }} props
 */
function SendMessageFields({ step, ctx, onChange }) {
  const taskSteps = ctx.humanTaskSteps ?? [];
  const missingTask = step.taskStepId && !taskSteps.some((t) => t.id === step.taskStepId);
  const tokens = useMemo(() => sendStepTokens(ctx.fields, Boolean(step.taskStepId)), [ctx.fields, step.taskStepId]);

  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <Label>Send</Label>
        <NotificationTypeSelect
          value={step.notificationTypeKey ?? null}
          onChange={(notificationTypeKey) => onChange({ notificationTypeKey })}
          types={ctx.notificationTypes ?? null}
        />
      </div>

      <PlaceholderValues
        typeKey={step.notificationTypeKey ?? null}
        types={ctx.notificationTypes ?? null}
        values={step.placeholderValues}
        onChange={(placeholderValues) => onChange({ placeholderValues })}
        tokens={tokens}
      />

      <div>
        <Label hint="— optional; lets the words use that task's details">About the task</Label>
        <select
          value={step.taskStepId ?? ''}
          onChange={(e) => onChange({ taskStepId: e.target.value || null })}
          aria-label="Human task this notification is about"
          className={`${controlClass} w-full`}
        >
          <option value="">None</option>
          {taskSteps.map((t) => (
            <option key={t.id} value={t.id}>{t.title || t.id}</option>
          ))}
          {missingTask && <option value={step.taskStepId}>{step.taskStepId} — no longer a task in this workflow</option>}
        </select>
      </div>

      <Note>
        Besides the values above, its words are sent this run&rsquo;s variables, the record&rsquo;s fields and{' '}
        <code className="font-mono">WorkflowName</code>
        {step.taskStepId ? (
          <>
            , plus the task&rsquo;s{' '}
            {TASK_VALUE_NAMES.map((v, i) => (
              <span key={v}>
                <code className="font-mono">{v}</code>{i < TASK_VALUE_NAMES.length - 1 ? ', ' : ''}
              </span>
            ))}
          </>
        ) : null}
        . A placeholder with the same name is filled from them.
      </Note>
    </div>
  );
}

export default memo(SendMessageFields);
