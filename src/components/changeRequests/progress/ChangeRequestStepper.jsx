'use client';

import { useMemo } from 'react';

import WorkflowStepper from '@/components/workflow/progress/WorkflowStepper';
import { useRecordProgress } from '@/components/workflow/progress/useRecordProgress';
import { TARGET_TYPE } from '@/constants/workflow';
import { changeRequestSteps } from '@/lib/changeRequest/progress';

/**
 * @param {{ changeRequest: Object|null }} props
 */
export default function ChangeRequestStepper({ changeRequest }) {
  const progress = useRecordProgress(TARGET_TYPE.BOQ_CHANGE_REQUEST, changeRequest);
  const { steps, next } = useMemo(
    () => changeRequestSteps({ changeRequest, run: progress.run, history: progress.history, graph: progress.graph }),
    [changeRequest, progress.run, progress.history, progress.graph]
  );

  const noRun = Boolean(changeRequest) && progress.ready && !progress.run && !changeRequest.waitingOn?.length;

  return (
    <WorkflowStepper
      steps={steps}
      next={next}
      ready={progress.ready}
      waitingOn={changeRequest?.waitingOn}
      hereLabel={changeRequest ? 'Now' : 'You are here'}
      label="Change request progress"
      emptyMessage={noRun ? 'No workflow runs on this request.' : null}
    />
  );
}
