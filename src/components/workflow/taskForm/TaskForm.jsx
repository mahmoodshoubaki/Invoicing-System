'use client';

import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, MessageSquare } from 'lucide-react';

import Button from '@/components/common/Button';
import { controlClass, labelClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { readableTextOn, withAlpha } from '@/utils/color';
import { selectBillingFrequencies } from '@/store/slices/lookupsSlice';
import ChangeRequestTaskFields from '@/components/changeRequests/task/ChangeRequestTaskFields';
import TaskAnswerDialog from '@/components/workflow/tasks/TaskAnswerDialog';
import TaskFormField from './TaskFormField';
import { useTaskForm } from './useTaskForm';

/**
 * @param {{ task: Object, onCompleted: (result: { task, button, instance }) => void, context?: Object|null }} props
 */
export default function TaskForm({ task, onCompleted, context = null }) {
  const form = useTaskForm(task, onCompleted, context);
  const billingFrequencies = useSelector(selectBillingFrequencies);
  // Fields whose numbers stand for names: offered as a list.
  const optionsByName = useMemo(() => ({
    billingFrequencyId: billingFrequencies.length
      ? billingFrequencies.map((f) => ({ value: String(f.id), label: f.label }))
      : null,
  }), [billingFrequencies]);
  const buttons = task.buttons ?? [];
  const busy = form.pressing !== null;
  // The button whose reason is being picked, before it is pressed.
  const [asking, setAsking] = useState(null);
  const needsComment = buttons.filter((b) => b.requiresComment).map((b) => b.label);
  const ignoresFields = form.fields.length > 0 ? buttons.filter((b) => !b.requiresFields).map((b) => b.label) : [];

  return (
    <div className="flex flex-col gap-4">
      {form.ownFields.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {form.ownFields.map((field) => (
            <TaskFormField
              key={field.name}
              field={field}
              form={form}
              disabled={busy}
              context={context}
              options={optionsByName[field.name] ?? null}
            />
          ))}
        </div>
      )}

      {form.asksForRequest && <ChangeRequestTaskFields task={task} parts={form.requestParts} handleRef={form.requestRef} />}

      <div>
        <label htmlFor={`comment-${task.taskId}`} className={labelClass} style={{ color: CHROME.textSecondary }}>
          Comment
          {needsComment.length > 0 && (
            <span className="ml-1 font-normal" style={{ color: CHROME.textMuted }}>
              — needed for {needsComment.join(', ')}
            </span>
          )}
        </label>
        <textarea
          id={`comment-${task.taskId}`}
          value={form.comment}
          onChange={(e) => form.setComment(e.target.value)}
          rows={2}
          disabled={busy}
          className={`${controlClass} w-full resize-y`}
          style={form.commentError ? { borderColor: STATUS.critical } : undefined}
        />
        {form.commentError && <p className="mt-1 text-[11px]" style={{ color: STATUS.critical }}>{form.commentError}</p>}
      </div>

      {form.errors.length > 0 && (
        <div className="rounded-lg px-3 py-2" style={{ backgroundColor: withAlpha(STATUS.critical, 0.07) }}>
          {form.errors.map((message) => (
            <p key={message} className="flex items-start gap-1.5 text-xs" style={{ color: STATUS.critical }}>
              <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
              {message}
            </p>
          ))}
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-center gap-2">
          {buttons.map((button) => (
            <Button
              key={button.key}
              size="sm"
              variant="primary"
              loading={form.pressing === button.key}
              disabled={busy && form.pressing !== button.key}
              onClick={() => (button.reasons ? setAsking(button) : form.press(button))}
              style={{
                backgroundColor: button.colorHex ?? '#f1f0ee',
                color: readableTextOn(button.colorHex, CHROME.textPrimary),
              }}
              title={button.requiresFields ? `${button.label} — saves the fields above` : button.label}
            >
              {(button.requiresComment || button.reasons) && <MessageSquare size={12} aria-hidden="true" />}
              {button.label}
            </Button>
          ))}
        </div>
        {ignoresFields.length > 0 && (
          <p className="mt-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>
            {ignoresFields.join(', ')} {ignoresFields.length === 1 ? 'does' : 'do'} not save what is typed above.
          </p>
        )}
      </div>

      {asking && (
        <TaskAnswerDialog
          key={asking.key}
          task={task}
          outcome={asking}
          open
          busy={busy}
          withComment={false}
          onClose={() => setAsking(null)}
          onConfirm={({ reasonKey, otherReason }) => {
            const button = asking;
            setAsking(null);
            form.press(button, { reasonKey, otherReason });
          }}
        />
      )}
    </div>
  );
}
