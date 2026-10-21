'use client';

import { useMemo } from 'react';

import RecordTaskPanel from '@/components/workflow/taskForm/RecordTaskPanel';

/**
 * The task the invoice's workflow is waiting on, when it is the signed-in
 * person's to answer (2026-10-11) — the same form as My Tasks, on the invoice
 * itself. Everyone else sees the invoice read-only, with who it waits on.
 *
 * @param {{ invoice: Object, onAnswered: () => void }} props  `onAnswered` reloads the invoice — the task's fields are now on it
 */
export default function InvoiceTaskPanel({ invoice, onAnswered }) {
  // The invoice's id lets a task's attachments be downloaded here (2026-10-13).
  const context = useMemo(() => ({ invoiceId: invoice.id }), [invoice.id]);
  return <RecordTaskPanel instanceIds={invoice.workflowInstanceId} context={context} onAnswered={onAnswered} />;
}
