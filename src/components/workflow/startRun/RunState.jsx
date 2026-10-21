import { AlertTriangle } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { INSTANCE_STATUS_COLORS, INSTANCE_STATUS_LABELS } from '@/constants/workflow';

/** What the run is doing, once it exists. */
export default function RunState({ instance }) {
  const color = INSTANCE_STATUS_COLORS[instance.statusKey] ?? CHROME.textMuted;

  return (
    <div className="rounded-lg border border-[#f1f0ee] bg-[#fbfaf9] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: withAlpha(color, 0.12), color }}
        >
          {INSTANCE_STATUS_LABELS[instance.statusKey] ?? instance.status}
        </span>
        <span className="text-[11px]" style={{ color: CHROME.textSecondary }}>
          {instance.currentStageTitle || instance.currentStageId || '—'}
          {instance.currentStepId && ` · ${instance.currentStepId}`}
        </span>
      </div>

      {/*
        A run standing somewhere it did not choose to be. A to-do from an
        earlier stage is still open and will bring it back — without saying so,
        a live to-do pointing at a different stage reads as a bug.
      */}
      {instance.returnStageId && (
        <p className="mt-2 text-[11px]" style={{ color: CHROME.textSecondary }}>
          Waiting on <strong>{instance.returnStepId}</strong>, then back to{' '}
          <strong>{instance.returnStageTitle || instance.returnStageId}</strong>.
        </p>
      )}

      {instance.failureReason && (
        <p
          className="mt-2 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug"
          style={{ backgroundColor: withAlpha(STATUS.critical, 0.1), color: CHROME.textSecondary }}
        >
          <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: STATUS.critical }} aria-hidden="true" />
          {/* Written to be read by a person — shown as-is, never reworded. */}
          <span>{instance.failureReason}</span>
        </p>
      )}

      {instance.pendingTasks?.length > 0 && (
        <p className="mt-2 text-[11px]" style={{ color: CHROME.textMuted }}>
          Waiting on {instance.pendingTasks.length} to-do{instance.pendingTasks.length === 1 ? '' : 's'}.
        </p>
      )}
    </div>
  );
}
