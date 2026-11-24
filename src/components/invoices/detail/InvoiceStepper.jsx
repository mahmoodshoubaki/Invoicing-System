'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

import WorkflowStepper from '@/components/workflow/progress/WorkflowStepper';
import { useRecordProgress } from '@/components/workflow/progress/useRecordProgress';
import { TARGET_TYPE } from '@/constants/workflow';
import { invoiceSteps } from '@/lib/invoiceProgress';

/**
 * @param {{ invoice: Object }} props
 */
export default function InvoiceStepper({ invoice }) {
  const t = useTranslations('invoices.detail');
  const tp = useTranslations('workflowProgress');
  const format = useLocaleFormat();
  const progress = useRecordProgress(TARGET_TYPE.INVOICE, invoice);
  const { steps, next } = useMemo(
    () => invoiceSteps({ invoice, run: progress.run, history: progress.history, graph: progress.graph, t: tp, locale: format.locale, formatDay: format.date }),
    [invoice, progress.run, progress.history, progress.graph, tp, format]
  );

  const noRun = progress.ready && !progress.run && !invoice.waitingOn?.length;

  return (
    <WorkflowStepper
      steps={steps}
      next={next}
      ready={progress.ready}
      waitingOn={invoice.waitingOn}
      label={t('progress')}
      emptyMessage={noRun ? t('noRun') : null}
    />
  );
}
