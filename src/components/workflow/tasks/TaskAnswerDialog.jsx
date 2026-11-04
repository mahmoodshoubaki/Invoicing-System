'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { reasonProblem } from '@/lib/taskReasons';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { readableTextOn } from '@/utils/color';
import ReasonPicker from './ReasonPicker';

const NO_REASON = { reasonKey: '', otherReason: '' };

/**
 * @param {{ task: Object, outcome: Object, open: boolean, busy: boolean, onClose: () => void, onConfirm: (answer: { comment: string|null, reasonKey: string, otherReason: string }) => void, withComment?: boolean, false where the comment box is already on the page }} props
 */
export default function TaskAnswerDialog({ task, outcome, open, busy, onClose, onConfirm, withComment = true }) {
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState(NO_REASON);
  const [tried, setTried] = useState(false);
  const trimmed = comment.trim();
  const commentMissing = withComment && outcome?.requiresComment && !trimmed;
  const problem = reasonProblem(outcome, reason);

  const confirm = () => {
    setTried(true);
    if (commentMissing || problem) return;
    onConfirm({ comment: trimmed || null, ...reason });
  };

  let title = outcome?.label ?? 'Answer';
  if (outcome?.reasons) title += ' — pick a reason';
  else if (outcome?.requiresComment) title += ' — say why';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <button
            type="button"
            disabled={busy || (tried && (commentMissing || Boolean(problem)))}
            onClick={confirm}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: outcome?.colorHex ?? '#f1f0ee',
              color: readableTextOn(outcome?.colorHex, CHROME.textPrimary),
            }}
          >
            <MessageSquare size={12} aria-hidden="true" />
            {outcome?.label ?? 'Confirm'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs" style={{ color: CHROME.textSecondary }}>
          <strong style={{ color: CHROME.textPrimary }}>{task?.title}</strong>
          {task?.definitionCode && ` · ${task.definitionCode}`}
        </p>
        {outcome?.reasons && (
          <ReasonPicker
            id={`task-reason-${task?.taskId}`}
            reasons={outcome.reasons}
            value={reason}
            onChange={setReason}
            error={tried ? problem : null}
            disabled={busy}
          />
        )}
        {withComment && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-comment" className="text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
              {outcome?.requiresComment ? `${outcome.label} requires a comment` : 'Comment (optional)'}
            </label>
            <textarea
              id="task-comment"
              rows={4}
              autoFocus={!outcome?.reasons}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Explain your decision…"
              className="w-full resize-y rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary"
              style={tried && commentMissing ? { borderColor: STATUS.critical } : undefined}
            />
          </div>
        )}
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
          Kept with the answer in the run&rsquo;s history.
        </p>
      </div>
    </Modal>
  );
}
