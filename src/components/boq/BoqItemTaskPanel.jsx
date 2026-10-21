'use client';

import { useMemo } from 'react';

import RecordTaskPanel from '@/components/workflow/taskForm/RecordTaskPanel';
import { useRecordRuns } from '@/components/workflow/taskForm/useRecordRuns';
import { usePermission } from '@/hooks/usePermission';
import { TARGET_TYPE } from '@/constants/workflow';
import { allow, WORKFLOW_INSTANCE_PERMISSIONS } from '@/constants/workflowPermissions';

/**
 * The task a BOQ item's workflow is waiting on, when it is the signed-in
 * person's to answer (2026-10-13) — the invoice page's panel, on the item.
 *
 * The item's reply does not name its run, so its runs are looked up by the
 * item (useRecordRuns) — which needs WorkflowInstances.View; without it the
 * item shows no task, and the task is still on My Tasks.
 *
 * The form knows the item and its contract window, so changing the billing
 * frequency or the expected invoicing date rebuilds its invoicing plan, as
 * the item's edit form does.
 *
 * @param {{ item: Object, contractStartDate: string|null, contractFinishDate: string|null, onAnswered: () => void }} props
 */
export default function BoqItemTaskPanel({ item, contractStartDate, contractFinishDate, onAnswered }) {
  const { can } = usePermission();
  const runIds = useRecordRuns(TARGET_TYPE.BOQ_ITEM, item.id, allow(can, WORKFLOW_INSTANCE_PERMISSIONS.VIEW));

  const context = useMemo(() => ({
    boqItemId: item.id,
    contractStartDate,
    contractFinishDate,
    expectedInvoicingDate: item.expectedInvoicingDate ?? null,
    billingFrequencyId: item.billingFrequencyId ?? null,
  }), [item.id, item.expectedInvoicingDate, item.billingFrequencyId, contractStartDate, contractFinishDate]);

  return <RecordTaskPanel instanceIds={runIds} context={context} onAnswered={onAnswered} />;
}
