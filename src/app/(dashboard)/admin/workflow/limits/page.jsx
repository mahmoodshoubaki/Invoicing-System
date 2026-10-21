'use client';

import PageHeader from '@/components/common/PageHeader';
import EngineLimitsTable from '@/components/workflow/admin/limits/EngineLimitsTable';
import { ChangesButton, NoAccessNote, ReadOnlyPill } from '@/components/workflow/admin/AdminNotes';
import { usePermission } from '@/hooks/usePermission';
import { allow, WORKFLOW_PERMISSIONS } from '@/constants/workflowPermissions';

/**
 * Admin › Workflow › Engine limits (2026-10-13, split from the engine page):
 * what the engine will tolerate. Reading is `Workflows.Manage`; changing needs
 * `Workflows.ManageSettings` — somebody who may draw a workflow does not
 * thereby decide what the engine tolerates.
 */
export default function EngineLimitsPage() {
  const { can } = usePermission();
  const canView = allow(can, WORKFLOW_PERMISSIONS.MANAGE);
  const canEdit = allow(can, WORKFLOW_PERMISSIONS.MANAGE_SETTINGS);

  if (!canView) {
    return (
      <div>
        <PageHeader title="Engine limits" />
        <NoAccessNote>You do not have permission to manage the workflow engine.</NoAccessNote>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Engine limits"
        subtitle="What the engine will tolerate. A change applies to the next thing that reads it — nothing is cached and nothing needs restarting."
        actions={
          <>
            {!canEdit && <ReadOnlyPill />}
            <ChangesButton />
          </>
        }
      />
      <EngineLimitsTable canEdit={canEdit} />
    </div>
  );
}
