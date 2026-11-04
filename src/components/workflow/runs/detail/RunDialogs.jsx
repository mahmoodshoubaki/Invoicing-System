'use client';

import ResumeDialog from '@/components/workflow/runs/ResumeDialog';
import StopRunDialog from '@/components/workflow/runs/StopRunDialog';
import ReassignDialog from '@/components/workflow/tasks/ReassignDialog';
import { describeTargets } from '@/lib/runDetail';

/**
 * @param {{ run: Object, instanceId: string, busy: boolean, openTaskCount: number, actions: ReturnType<import('./useRunActions').useRunActions>, }} props
 */
export default function RunDialogs({ run, instanceId, busy, openTaskCount, actions }) {
  const { stopping, resuming, handingOn } = actions;

  return (
    <>
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
