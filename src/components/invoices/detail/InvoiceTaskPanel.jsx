'use client';

import { useMemo } from 'react';

import RecordTaskPanel from '@/components/workflow/taskForm/RecordTaskPanel';

/**
 * @param {{ invoice: Object, onAnswered: () => void }} props
 */
export default function InvoiceTaskPanel({ invoice, onAnswered }) {
  const context = useMemo(() => ({ invoiceId: invoice.id }), [invoice.id]);
  return <RecordTaskPanel instanceIds={invoice.workflowInstanceId} context={context} onAnswered={onAnswered} />;
}
