'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { CHROME } from '@/theme/vizPalette';
import { readableTextOn } from '@/utils/color';

/**
 * Answering a to-do with an outcome that demands a reason.
 *
 * A dialog rather than the inline panel the old card list used, because a
 * table row has no room to grow a textarea without shoving every row below it
 * down the page — and in a long list that is exactly the moment somebody loses
 * their place.
 *
 * Whether a comment is required is the workflow author's call, expressed per
 * outcome as `requiresComment`. The server refuses an empty one (WF-019) too;
 * this stops that round trip.
 */
export default function TaskCommentDialog({ task, outcome, open, busy, onClose, onConfirm }) {
  const [comment, setComment] = useState('');
  const trimmed = comment.trim();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${outcome?.label ?? 'Answer'} — say why`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          {/* Coloured as the author coloured the outcome, so the confirm button
              reads as the same choice the row offered, not a generic OK. */}
          <button
            type="button"
            disabled={!trimmed || busy}
            onClick={() => onConfirm({ comment: trimmed })}
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
      <div className="flex flex-col gap-2">
        <p className="text-xs" style={{ color: CHROME.textSecondary }}>
          <strong style={{ color: CHROME.textPrimary }}>{task?.title}</strong>
          {task?.definitionCode && ` · ${task.definitionCode}`}
        </p>
        <label htmlFor="task-comment" className="text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
          {outcome?.label} requires a comment
        </label>
        <textarea
          id="task-comment"
          rows={4}
          autoFocus
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Explain your decision…"
          className="w-full resize-y rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary"
        />
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
          Kept with the answer in the run&rsquo;s history.
        </p>
      </div>
    </Modal>
  );
}
