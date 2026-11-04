'use client';

import { useState } from 'react';
import { CircleSlash, Info, OctagonAlert, PauseCircle } from 'lucide-react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { INSTANCE_STATUS } from '@/constants/workflow';

const controlClass =
  'w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary';

const MODES = {
  pause: {
    title: 'Pause this run?',
    confirmLabel: 'Pause the run',
    confirmVariant: 'primary',
    confirmIcon: PauseCircle,
    cancelLabel: 'Leave it running',
    tone: '#F59E0B',
    icon: Info,
    placeholder: 'Waiting on the client to confirm scope',
    headline: <>This can be undone. <strong>Resume</strong> picks the run up exactly where it stopped.</>,
  },
  cancel: {
    title: 'Stop this run?',
    confirmLabel: 'Stop the run',
    confirmVariant: 'danger',
    confirmIcon: CircleSlash,
    cancelLabel: 'Keep it running',
    tone: STATUS.critical,
    icon: OctagonAlert,
    placeholder: 'Invoice was withdrawn',
    headline: (
      <>
        <strong>This cannot be undone.</strong> A stopped run cannot be resumed — Resume only brings
        back a run that <em>paused</em> or <em>faulted</em>. Running this workflow again means
        starting from the beginning.
      </>
    ),
  },
};

export default function StopRunDialog({
  mode = 'cancel', instance, openTaskCount = 0, targets, open, busy, onClose, onConfirm,
}) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();

  const m = MODES[mode] ?? MODES.cancel;
  const faulted = instance?.statusKey === INSTANCE_STATUS.FAULTED;
  const keepLabel = faulted ? 'Leave it as it is' : m.cancelLabel;
  const Icon = m.icon;
  const ConfirmIcon = m.confirmIcon;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={m.title}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>{keepLabel}</Button>
          <Button
            variant={m.confirmVariant}
            icon={ConfirmIcon}
            loading={busy}
            disabled={!trimmed}
            onClick={() => onConfirm({ reason: trimmed })}
          >
            {m.confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs" style={{ color: CHROME.textSecondary }}>
          {instance?.definitionCode} · v{instance?.definitionVersion}
          {instance?.currentStageTitle && ` · ${instance.currentStageTitle}`}
        </p>

        <div
          className="flex items-start gap-2 rounded-lg px-2.5 py-2"
          style={{ backgroundColor: withAlpha(m.tone, 0.09) }}
        >
          <Icon size={13} className="mt-0.5 shrink-0" style={{ color: m.tone }} aria-hidden="true" />
          <div className="text-[11px] leading-relaxed" style={{ color: CHROME.textSecondary }}>
            <p>{m.headline}</p>

            {mode === 'cancel' && openTaskCount > 0 && (
              <p className="mt-1.5">
                <strong>
                  {openTaskCount} open to-do{openTaskCount === 1 ? '' : 's'} will be withdrawn
                </strong>{' '}
                from whoever they are assigned to.
              </p>
            )}

            {mode === 'pause' && openTaskCount > 0 && (
              <p className="mt-1.5">
                {openTaskCount === 1 ? 'Its open to-do stays' : `Its ${openTaskCount} open to-dos stay`}{' '}
                in people&rsquo;s lists, but cannot be answered until the run is resumed.
              </p>
            )}

            {mode === 'cancel' && faulted && (
              <p className="mt-1.5">
                It still holds its records while it is faulted — stopping it lets them go, so they can be
                changed again or picked up by another run.
              </p>
            )}

            {targets && targets.count > 1 && (
              <p className="mt-1.5">
                This run covers <strong>{targets.count} records</strong> — it{' '}
                {mode === 'pause' ? 'pauses' : 'stops'} for all of them.
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="mb-1 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
            {mode === 'pause' ? 'Why are you pausing it?' : 'Why are you stopping it?'}
            <span className="ml-1 font-normal" style={{ color: STATUS.critical }}>— required</span>
          </p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={m.placeholder}
            aria-label="Reason"
            className={controlClass}
          />
          <p className="mt-1 text-[11px]" style={{ color: CHROME.textMuted }}>
            Kept in the run&rsquo;s history. It is the only explanation the run carries, so it is
            worth a sentence somebody else can act on.
          </p>
        </div>
      </div>
    </Modal>
  );
}
