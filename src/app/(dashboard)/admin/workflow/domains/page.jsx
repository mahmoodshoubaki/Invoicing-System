'use client';

import PageHeader from '@/components/common/PageHeader';
import ApiDomainsTable from '@/components/workflow/admin/domains/ApiDomainsTable';
import ApproveDomainForm from '@/components/workflow/admin/domains/ApproveDomainForm';
import { ChangesButton, NoAccessNote, ReadOnlyPill } from '@/components/workflow/admin/AdminNotes';
import { usePermission } from '@/hooks/usePermission';
import { allow, WORKFLOW_PERMISSIONS } from '@/constants/workflowPermissions';

/**
 * Admin › Workflow › Approved domains (2026-10-13, split from the engine page):
 * where a workflow's API calls may go — this application's own API as well as
 * anybody else's. A step pointed anywhere else saves fine and then fails when
 * it runs.
 *
 * Reading is `Workflows.Manage`; approving and withdrawing need
 * `Workflows.ManageApiDomains` — somebody who may draw a workflow does not
 * thereby decide what the server may talk to.
 */
export default function ApprovedDomainsPage() {
  const { can } = usePermission();
  const canView = allow(can, WORKFLOW_PERMISSIONS.MANAGE);
  const canManage = allow(can, WORKFLOW_PERMISSIONS.MANAGE_API_DOMAINS);

  if (!canView) {
    return (
      <div>
        <PageHeader title="Approved domains" />
        <NoAccessNote>You do not have permission to manage the workflow engine.</NoAccessNote>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Approved domains"
        subtitle="Where a workflow's API calls may go — this application's own API included. A step pointed anywhere else saves fine and then fails when it runs."
        actions={
          <>
            {!canManage && <ReadOnlyPill />}
            <ChangesButton />
          </>
        }
      />
      {canManage && <ApproveDomainForm />}
      <ApiDomainsTable canManage={canManage} />
    </div>
  );
}
