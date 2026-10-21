'use client';

import ResumeDialog from '@/components/workflow/runs/ResumeDialog';
import StopRunDialog from '@/components/workflow/runs/StopRunDialog';
import ReassignDialog from '@/components/workflow/tasks/ReassignDialog';
import { describeTargets } from '@/lib/runDetail';

/**
 * The dialogs a run's actions open: pause or stop, resume, and hand a to-do on.
 *
 * @param {{
 *   run: Object, instanceId: string, busy: boolean, openTaskCount: number,
 *   actions: ReturnType<import('./useRunActions').useRunActions>,
 * }} props
 */
export default function RunDialogs({ run, instanceId, busy, openTaskCount, actions }) {
  const { stopping, resuming, handingOn } = actions;

  return (
    <>
      {/* Mounted per opening so the reason box starts empty — a reason left
          over from a previous glance at this dialog is the last thing that
          should ride along with an irreversible action. */}
      {stopping && (
        <StopRunDialog
          key={stopping}
          mode={stopping}
          instance={run}
          openTaskCount={openTaskCount}
          targets={describeTargets(run.targetIds)}
          open
          busy={busy}
          onClose={actions.cancelStop}
          onConfirm={actions.handleStop}
        />
      )}

      {resuming && (
        <ResumeDialog
          instance={run}
          detail={run}
          loadingDetail={false}
          open
          busy={busy}
          onClose={actions.cancelResume}
          onConfirm={actions.handleResume}
        />
      )}

      {/* Keyed per task so the pickers start empty each time. A run's task row
          does not carry the run's own details, so they are added for the
          dialog's heading. */}
      {handingOn && (
        <ReassignDialog
          key={handingOn.taskId}
          task={{
            ...handingOn,
            instanceId,
            definitionCode: run.definitionCode,
            currentStageTitle: run.currentStageTitle,
            projectCode: run.projectCode,
          }}
          open
          busy={actions.reassigning}
          onClose={actions.cancelReassign}
          onConfirm={actions.handleReassign}
        />
      )}
    </>
  );
}
