'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, ExternalLink, Play, RotateCcw } from 'lucide-react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { ROUTES } from '@/constants/routes';
import RunState from './RunState';
import StartRunForm from './StartRunForm';
import { useStartRun } from './useStartRun';

/**
 * Start a run of one workflow, and nudge it once it exists.
 *
 * Two halves, because starting and steering are different jobs and the second
 * only makes sense after the first: the little form a manual trigger declares,
 * and then the run itself with the one button its status allows.
 *
 * Opened from two places. From a workflow's own card the records are typed in.
 * From a record's "Workflow runs" list (an invoice, say) the record is already
 * known: it arrives as `presetTargetIds`, shown but not editable, so a re-run
 * cannot quietly land on a different invoice from the one being looked at.
 *
 * Any published workflow can be started by hand, event- and schedule-triggered
 * ones included; they simply have no inputs to ask for.
 *
 * @param {{
 *   workflow: { code: string, name?: string }, open: boolean, onClose: () => void,
 *   presetTargetIds?: string[]|null,
 *   presetTargetTypeKey?: number|null,
 *   presetTargetLabel?: string,
 *   onStarted?: (instance: Object) => void,
 *   onOpenRun?: () => void,  when leaving for the run page; defaults to onClose
 * }} props
 */
export default function StartRunModal({
  workflow, open, onClose,
  presetTargetIds = null, presetTargetTypeKey = null, presetTargetLabel = null, onStarted, onOpenRun,
}) {
  const start = useStartRun({ workflow, open, presetTargetIds, presetTargetTypeKey, onStarted });
  const { definition, instance, nudge } = start;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={instance ? 'Run started' : `Start ${workflow?.name ?? 'a workflow'}`}
      size="md"
      footer={
        instance ? (
          <>
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Link href={ROUTES.MONITORING_RUN(instance.instanceId)} onClick={onOpenRun ?? onClose}>
              <Button variant="outline" icon={ExternalLink}>Open run</Button>
            </Link>
            {nudge && (
              <Button
                icon={nudge === 'resume' ? RotateCcw : ArrowRight}
                onClick={start.handleNudge}
                loading={start.isAdvancing}
              >
                {nudge === 'resume' ? 'Resume' : 'Advance'}
              </Button>
            )}
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button icon={Play} onClick={start.handleStart} disabled={!start.ready} loading={start.submitting}>
              Start
            </Button>
          </>
        )
      }
    >
      {start.loadError ? (
        <p className="text-xs" style={{ color: STATUS.critical }}>{start.loadError}</p>
      ) : !definition ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : instance ? (
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-1.5 text-xs" style={{ color: CHROME.textSecondary }}>
            <CheckCircle2 size={13} style={{ color: STATUS.good }} aria-hidden="true" />
            {workflow.name} · v{instance.definitionVersion}
          </p>

          <RunState instance={instance} />

          {/*
            The loop guard is the one fault a plain resume does not fix: the
            step count is untouched, so the run stands up, walks one step and
            faults again. Resetting it is a separate decision, and raising the
            ceiling comes first if the workflow really is that long.
          */}
          {start.loopStopped && (
            <p
              className="flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug"
              style={{ backgroundColor: withAlpha(STATUS.warning, 0.1), color: CHROME.textSecondary }}
            >
              <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
              <span>
                This run was stopped for running too many steps. Resuming it alone will not help — it
                will walk one step and stop again. Raise the step ceiling in the workflow admin
                settings first, then start its step count again from there.
              </span>
            </p>
          )}
        </div>
      ) : (
        <StartRunForm start={start} presetTargetLabel={presetTargetLabel} />
      )}
    </Modal>
  );
}
