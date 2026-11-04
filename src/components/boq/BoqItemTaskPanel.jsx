'use client';

import { useMemo } from 'react';

import RecordTaskPanel from '@/components/workflow/taskForm/RecordTaskPanel';
import { useRecordRuns } from '@/components/workflow/taskForm/useRecordRuns';
import { usePermission } from '@/hooks/usePermission';
import { TARGET_TYPE } from '@/constants/workflow';
import { allow, WORKFLOW_INSTANCE_PERMISSIONS } from '@/constants/workflowPermissions';

/**
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
