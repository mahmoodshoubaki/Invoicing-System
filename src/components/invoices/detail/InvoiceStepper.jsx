'use client';

import { useMemo } from 'react';

import WorkflowStepper from '@/components/workflow/progress/WorkflowStepper';
import { useRecordProgress } from '@/components/workflow/progress/useRecordProgress';
import { TARGET_TYPE } from '@/constants/workflow';
import { invoiceSteps } from '@/lib/invoiceProgress';

/**
 * @param {{ invoice: Object }} props
 */
export default function InvoiceStepper({ invoice }) {
  const progress = useRecordProgress(TARGET_TYPE.INVOICE, invoice);
  const { steps, next } = useMemo(
    () => invoiceSteps({ invoice, run: progress.run, history: progress.history, graph: progress.graph }),
    [invoice, progress.run, progress.history, progress.graph]
  );

  const noRun = progress.ready && !progress.run && !invoice.waitingOn?.length;

  return (
    <WorkflowStepper
      steps={steps}
      next={next}
      ready={progress.ready}
      waitingOn={invoice.waitingOn}
      label="Invoice progress"
      emptyMessage={noRun ? 'No workflow runs on this request.' : null}
    />
  );
}
