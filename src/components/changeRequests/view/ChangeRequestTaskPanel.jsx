'use client';

import RecordTaskPanel from '@/components/workflow/taskForm/RecordTaskPanel';
import { useRecordRuns } from '@/components/workflow/taskForm/useRecordRuns';
import { usePermission } from '@/hooks/usePermission';
import { TARGET_TYPE } from '@/constants/workflow';
import { allow, WORKFLOW_INSTANCE_PERMISSIONS } from '@/constants/workflowPermissions';

/**
 * @param {{ changeRequestId: number|string, onAnswered: () => void }} props
 */
export default function ChangeRequestTaskPanel({ changeRequestId, onAnswered }) {
  const { can } = usePermission();
  const runIds = useRecordRuns(TARGET_TYPE.BOQ_CHANGE_REQUEST, changeRequestId, allow(can, WORKFLOW_INSTANCE_PERMISSIONS.VIEW));
  return <RecordTaskPanel instanceIds={runIds} onAnswered={onAnswered} />;
}
