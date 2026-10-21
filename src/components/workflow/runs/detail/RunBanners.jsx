import { AlertTriangle, CircleSlash, Split, Undo2 } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { INSTANCE_STATUS } from '@/constants/workflow';
import { branchProgress, cancellationReason, returnPath } from '@/lib/runDetail';

/** A coloured panel that says one thing about the run's state. */
function Banner({ tone, icon: Icon, title, children }) {
  return (
    <div
      className="mb-4 flex items-start gap-2 rounded-xl px-3.5 py-3"
      style={{ backgroundColor: withAlpha(tone, 0.09), border: `1px solid ${withAlpha(tone, 0.25)}` }}
    >
      <Icon size={14} className="mt-0.5 shrink-0" style={{ color: tone }} aria-hidden="true" />
      <div className="min-w-0">
        {title && (
          <p className="text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{title}</p>
        )}
        <div className="text-[11px] leading-relaxed" style={{ color: CHROME.textSecondary }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * What the run's own fields cannot say at a glance: why it stopped, that it is
 * in two places at once, how far its parallel branches have got.
 *
 * @param {{ run: Object, history: Array }} props
 */
export default function RunBanners({ run, history }) {
  const cancelled = cancellationReason(run, history);
  const branches = branchProgress(run.branches);
  const back = returnPath(run);

  return (
    <>
      {/*
        A cancelled run never explains itself from its own fields — nothing
        failed, so `failureReason` is null and the reason is in the history.
        Without this a Cancelled badge is a dead end, and the "its subject was
        deleted" case reads as the system losing somebody's work.
      */}
      {run.statusKey === INSTANCE_STATUS.CANCELLED && (
        <Banner tone={STATUS.neutral} icon={CircleSlash} title="This run was stopped">
          {cancelled ?? 'No reason was recorded.'}
        </Banner>
      )}

      {run.failureReason && (
        <Banner tone={STATUS.critical} icon={AlertTriangle} title="Why it stopped">
          {/* Written by the engine to be read by a person — shown as it arrived. */}
          {run.failureReason}
        </Banner>
      )}

      {back && (
        <Banner tone={STATUS.warning} icon={Undo2} title="This run is in two places">
          It is standing in <strong>{run.currentStageTitle ?? run.currentStageId}</strong>, and still
          owed an answer on {back.stepId ? <strong>{back.stepId}</strong> : 'a to-do'} back in{' '}
          <strong>{back.stageTitle}</strong>. Whoever acts first decides what happens: answer the
          to-do and the run returns there, or let this stage finish and the to-do is cancelled with
          everything else.
        </Banner>
      )}

      {branches && (
        <Banner tone={STATUS.info} icon={Split} title={`${branches.done} of ${branches.total} branches done`}>
          {branches.waiting.length === 0
            ? 'Every branch has finished.'
            : <>Still waiting on {branches.waiting.map((b) => `${b.id} (at ${b.stepId})`).join(', ')}.</>}
        </Banner>
      )}
    </>
  );
}
