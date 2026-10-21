'use client';

import { useMemo } from 'react';

import WorkflowStepper from '@/components/workflow/progress/WorkflowStepper';
import { useRecordProgress } from '@/components/workflow/progress/useRecordProgress';
import { TARGET_TYPE } from '@/constants/workflow';
import { invoiceSteps } from '@/lib/invoiceProgress';

/**
 * Where an invoice is, and what comes next (2026-10-21) — submitted, the
 * stages of its workflow, collected (or rejected or cancelled) — and who it
 * waits on. It holds what the "Waiting on" banner used to say.
 *
 * @param {{ invoice: Object }} props
 */
export default function InvoiceStepper({ invoice }) {
  const progress = useRecordProgress(TARGET_TYPE.INVOICE, invoice);
  const { steps, next } = useMemo(
    () => invoiceSteps({ invoice, run: progress.run, history: progress.history, graph: progress.graph }),
    [invoice, progress.run, progress.history, progress.graph]
  );

  // No run, and nobody holding a to-do on it: nothing to step through (2026-10-21).
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
