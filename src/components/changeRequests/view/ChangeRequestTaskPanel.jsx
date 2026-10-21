'use client';

import RecordTaskPanel from '@/components/workflow/taskForm/RecordTaskPanel';
import { useRecordRuns } from '@/components/workflow/taskForm/useRecordRuns';
import { usePermission } from '@/hooks/usePermission';
import { TARGET_TYPE } from '@/constants/workflow';
import { allow, WORKFLOW_INSTANCE_PERMISSIONS } from '@/constants/workflowPermissions';

/**
 * The task a change request's workflow is waiting on, when it is the
 * signed-in person's to answer (2026-10-20) — like the invoice's and the BOQ
 * item's. The request stays Submitted while a task has it back with its
 * requester, so this is where they fix it: its reasons, details and changes,
 * in the create form's parts.
 *
 * Its runs are looked up by the request (useRecordRuns), which needs
 * WorkflowInstances.View; without it the task is still on My Tasks.
 *
 * @param {{ changeRequestId: number|string, onAnswered: () => void }} props
 */
export default function ChangeRequestTaskPanel({ changeRequestId, onAnswered }) {
  const { can } = usePermission();
  const runIds = useRecordRuns(TARGET_TYPE.BOQ_CHANGE_REQUEST, changeRequestId, allow(can, WORKFLOW_INSTANCE_PERMISSIONS.VIEW));
  return <RecordTaskPanel instanceIds={runIds} onAnswered={onAnswered} />;
}
