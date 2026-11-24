'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import WorkflowStepper from '@/components/workflow/progress/WorkflowStepper';
import { useRecordProgress } from '@/components/workflow/progress/useRecordProgress';
import { TARGET_TYPE } from '@/constants/workflow';
import { BOQ_ITEM_STATUS_ID } from '@/constants/statuses';
import { boqItemSteps } from '@/lib/boqItemProgress';

/**
 * @param {{ item: Object }} props
 */
export default function BoqItemStepper({ item }) {
  const t = useTranslations('boq.item');
  const tp = useTranslations('workflowProgress');
  const locale = useLocale();
  const progress = useRecordProgress(TARGET_TYPE.BOQ_ITEM, item);
  const { steps, next } = useMemo(
    () => boqItemSteps({ item, run: progress.run, history: progress.history, graph: progress.graph, t: tp, locale }),
    [item, progress.run, progress.history, progress.graph, tp, locale]
  );

  const noRun = item.statusId !== BOQ_ITEM_STATUS_ID.DRAFT && progress.ready && !progress.run && !item.waitingOn?.length;

  return (
    <WorkflowStepper
      steps={steps}
      next={next}
      ready={progress.ready}
      waitingOn={item.waitingOn}
      label={t('progressLabel')}
      emptyMessage={noRun ? t('noRun') : null}
    />
  );
}
