'use client';

import { Send } from 'lucide-react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import ErrorNote from '@/components/ui/ErrorNote';
import { CHROME, STATUS } from '@/theme/vizPalette';
import ResendChannelText from './ResendChannelText';
import ResendRecipients from './ResendRecipients';
import { useResend } from './useResend';

/**
 * Resending with edited text: NEW notifications made from this one, words
 * changed first — to the person it was for, to typed To and CC addresses, or
 * both (2026-10-13). The old one and the template stay as they were.
 *
 * @param {{
 *   details: Object, onClose: () => void,
 *   onDone: (result: { notificationId: string|null, notificationIds: string[] }) => void,
 * }} props
 */
export default function ResendDialog({ details, onClose, onDone }) {
  const resend = useResend(details, onDone);
  const previousName = details.recipientName || details.recipientEmail || 'the person it was for';

  return (
    <Modal
      open
      onClose={resend.busy ? () => {} : onClose}
      title="Resend with edited text"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={resend.busy}>Cancel</Button>
          <Button icon={Send} onClick={resend.send} loading={resend.busy} disabled={!resend.canSend}>
            {resend.copies > 1 ? `Send ${resend.copies} copies` : 'Send as a new notification'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs" style={{ color: CHROME.textMuted }}>
          This makes new notifications. This one, and the type&rsquo;s words, stay as they are.
        </p>

        <ResendRecipients resend={resend} previousName={previousName} />

        {resend.rows.map((row, i) => (
          <ResendChannelText key={row.channelKey} row={row} onChange={(change) => resend.patchRow(i, change)} />
        ))}

        {resend.problems.channels && <p className="text-[11px]" style={{ color: STATUS.critical }}>{resend.problems.channels}</p>}
        {resend.missingText && <p className="text-[11px]" style={{ color: STATUS.critical }}>Every included channel needs all four texts.</p>}
        {resend.otherErrors.map((m) => <p key={m} className="text-[11px]" style={{ color: STATUS.critical }}>{m}</p>)}
        <ErrorNote error={resend.error} compact />
      </div>
    </Modal>
  );
}
