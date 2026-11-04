'use client';

import { useMemo } from 'react';

import WorkflowStepper from '@/components/workflow/progress/WorkflowStepper';
import { useRecordProgress } from '@/components/workflow/progress/useRecordProgress';
import { TARGET_TYPE } from '@/constants/workflow';
import { BOQ_ITEM_STATUS_ID } from '@/constants/statuses';
import { boqItemSteps } from '@/lib/boqItemProgress';

/**
 * @param {{ item: Object }} props
 */
export default function BoqItemStepper({ item }) {
  const progress = useRecordProgress(TARGET_TYPE.BOQ_ITEM, item);
  const { steps, next } = useMemo(
    () => boqItemSteps({ item, run: progress.run, history: progress.history, graph: progress.graph }),
    [item, progress.run, progress.history, progress.graph]
  );

  const noRun = item.statusId !== BOQ_ITEM_STATUS_ID.DRAFT && progress.ready && !progress.run && !item.waitingOn?.length;

  return (
    <WorkflowStepper
      steps={steps}
      next={next}
      ready={progress.ready}
      waitingOn={item.waitingOn}
      label="BOQ item progress"
      emptyMessage={noRun ? 'No workflow runs on this item.' : null}
    />
  );
}
