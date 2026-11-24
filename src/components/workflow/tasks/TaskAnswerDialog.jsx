'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('tasks.answer');
  const te = useTranslations('tasks.errors');
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState(NO_REASON);
  const [tried, setTried] = useState(false);
  const trimmed = comment.trim();
  const commentMissing = withComment && outcome?.requiresComment && !trimmed;
  const problem = reasonProblem(outcome, reason, te);

  const confirm = () => {
    setTried(true);
    if (commentMissing || problem) return;
    onConfirm({ comment: trimmed || null, ...reason });
  };

  let title = outcome?.label ?? t('answer');
  if (outcome?.reasons) title += ` — ${t('pickReason')}`;
  else if (outcome?.requiresComment) title += ` — ${t('sayWhy')}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t('cancel')}</Button>
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
            {outcome?.label ?? t('confirm')}
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
              {outcome?.requiresComment ? t('requiresComment', { label: outcome.label }) : t('commentOptional')}
            </label>
            <textarea
              id="task-comment"
              rows={4}
              autoFocus={!outcome?.reasons}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('placeholder')}
              className="w-full resize-y rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary"
              style={tried && commentMissing ? { borderColor: STATUS.critical } : undefined}
            />
          </div>
        )}
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
          {t('kept')}
        </p>
      </div>
    </Modal>
  );
}
