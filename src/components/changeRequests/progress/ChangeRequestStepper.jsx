'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

import WorkflowStepper from '@/components/workflow/progress/WorkflowStepper';
import { useRecordProgress } from '@/components/workflow/progress/useRecordProgress';
import { TARGET_TYPE } from '@/constants/workflow';
import { changeRequestSteps } from '@/lib/changeRequest/progress';

/**
 * @param {{ changeRequest: Object|null }} props
 */
export default function ChangeRequestStepper({ changeRequest }) {
  const t = useTranslations('changeRequests.progress');
  const tp = useTranslations('workflowProgress');
  const format = useLocaleFormat();
  const progress = useRecordProgress(TARGET_TYPE.BOQ_CHANGE_REQUEST, changeRequest);
  const { steps, next } = useMemo(
    () => changeRequestSteps({ changeRequest, run: progress.run, history: progress.history, graph: progress.graph, t: tp, locale: format.locale, formatDay: format.date }),
    [changeRequest, progress.run, progress.history, progress.graph, tp, format]
  );

  const noRun = Boolean(changeRequest) && progress.ready && !progress.run && !changeRequest.waitingOn?.length;

  return (
    <WorkflowStepper
      steps={steps}
      next={next}
      ready={progress.ready}
      waitingOn={changeRequest?.waitingOn}
      hereLabel={changeRequest ? tp('now') : tp('changeRequest.youAreHere')}
      label={t('label')}
      emptyMessage={noRun ? t('noRun') : null}
    />
  );
}
