'use client';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, MessageSquare } from 'lucide-react';

import Button from '@/components/common/Button';
import { controlClass, labelClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { readableTextOn, withAlpha } from '@/utils/color';
import { selectBillingFrequencies } from '@/store/slices/lookupsSlice';
import ChangeRequestTaskFields from '@/components/changeRequests/task/ChangeRequestTaskFields';
import TaskFormField from './TaskFormField';
import { useTaskForm } from './useTaskForm';

/**
 * A task's form (2026-10-11): the boxes it asks its holder to fill, a comment,
 * and its buttons — drawn exactly as the workflow's author made them.
 *
 * A button that saves the fields checks the required ones and sends them with
 * the press; the server may still refuse (a number already used by another
 * invoice), and then the task stays open with the reason under the box. A
 * button that does not save them sends nothing — said beside it, so nobody
 * types an invoice number and presses "Return to BDM" expecting it kept.
 *
 * `context` names the record the task is about, where the page knows it — the
 * BOQ item's own page passes its id and contract window, so changing its
 * frequency or expected date rebuilds its invoicing plan; the invoice's page
 * passes its id, so its attachments can be downloaded (2026-10-13).
 *
 * A task on a change request (2026-10-20) draws the request's reasons,
 * details and changes with the create form's parts, below the other boxes.
 *
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
              // Primary's shape; the colours below are the author's.
              variant="primary"
              loading={form.pressing === button.key}
              disabled={busy && form.pressing !== button.key}
              onClick={() => form.press(button)}
              style={{
                // The author's colour; only the text colour is ours, for contrast.
                backgroundColor: button.colorHex ?? '#f1f0ee',
                color: readableTextOn(button.colorHex, CHROME.textPrimary),
              }}
              title={button.requiresFields ? `${button.label} — saves the fields above` : button.label}
            >
              {button.requiresComment && <MessageSquare size={12} aria-hidden="true" />}
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
    </div>
  );
}
