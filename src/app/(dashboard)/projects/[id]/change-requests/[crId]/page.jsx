'use client';

import { useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, FileDiff, PencilLine, Workflow } from 'lucide-react';

import SubPageHeader from '@/components/common/SubPageHeader';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorNote from '@/components/ui/ErrorNote';
import ChangeRequestStatusBadge from '@/components/changeRequests/view/ChangeRequestStatusBadge';
import ChangeRequestOverview from '@/components/changeRequests/view/ChangeRequestOverview';
import ChangeRequestTaskPanel from '@/components/changeRequests/view/ChangeRequestTaskPanel';
import TargetRunsModal from '@/components/workflow/runs/TargetRunsModal';
import ProjectSummaryCard from '@/components/projects/ProjectSummaryCard';
import { useProjectSummary } from '@/components/projects/useProjectSummary';
import ChangeRequestStepper from '@/components/changeRequests/progress/ChangeRequestStepper';
import FieldChangesTable from '@/components/changeRequests/view/FieldChangesTable';
import CycleChangesTable from '@/components/changeRequests/view/CycleChangesTable';
import { changeRequestRepository } from '@/repositories/changeRequestRepository';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { usePermission } from '@/hooks/usePermission';
import { allow, WORKFLOW_INSTANCE_PERMISSIONS } from '@/constants/workflowPermissions';
import { TARGET_TYPE } from '@/constants/workflow';
import { CR_PERMISSIONS, CR_STATUS } from '@/constants/changeRequests';
import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';

/**
 * One change request (2026-10-19) — ChangeRequests.View, and the server shows
 * it only to whoever may see it (ViewAll, its requester, or whoever its
 * workflow waits on). The summary first, then every change old → new.
 *
 * A request sent back (Returned) can be edited and sent again by its requester
 * — offered to anyone with ChangeRequests.Update, since the app does not know
 * who is signed in by id; the server refuses anyone else.
 *
 * A workflow can also hand the request back through a task (2026-10-20) — it
 * stays Submitted then, so who has it is read from `waitingOn`, and the task
 * itself is answered here when it is the signed-in person's.
 *
 * "Workflow runs" (2026-10-21) lists every run on the request, as on an
 * invoice — only for WorkflowInstances.View, which the runs need.
 */
export default function ChangeRequestPage() {
  const { id: rawId, crId } = useParams();
  const projectCode = decodeURIComponent(rawId);
  const encoded = encodeURIComponent(projectCode);
  const { can } = usePermission();
  const [cr, setCr] = useState(null);
  const [error, setError] = useState(null);
  const [runsOpen, setRunsOpen] = useState(false);
  const project = useProjectSummary(projectCode);
  const canViewRuns = allow(can, WORKFLOW_INSTANCE_PERMISSIONS.VIEW);

  const load = useCallback(async () => {
    try {
      setCr(await changeRequestRepository.getChangeRequestById(crId));
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [crId]);
  useLoadOnChange(load);

  const tabHref = ROUTES.PROJECT_CHANGE_REQUESTS(encoded);
  const canResubmit = cr?.statusId === CR_STATUS.RETURNED && allow(can, CR_PERMISSIONS.UPDATE);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Rendered only for someone who may see runs, so it never asks for them otherwise. */}
      {canViewRuns && cr && (
        <TargetRunsModal
          open={runsOpen}
          onClose={() => setRunsOpen(false)}
          targetTypeKey={TARGET_TYPE.BOQ_CHANGE_REQUEST}
          targetId={cr.id}
          recordLabel={cr.number || 'this change request'}
        />
      )}
      <SubPageHeader
        eyebrow="Change request"
        title={cr ? <span className="inline-flex flex-wrap items-center gap-2">{cr.number} <ChangeRequestStatusBadge statusId={cr.statusId} size="sm" /></span> : 'Change request'}
        icon={FileDiff}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: projectCode, href: ROUTES.PROJECT_DETAIL(encoded) },
          { label: 'Change requests', href: tabHref },
          { label: cr?.number ?? '…' },
        ]}
        actions={
          <>
            <Link href={tabHref}>
              <Button variant="ghost" icon={ChevronLeft} size="sm">Back</Button>
            </Link>
            {canViewRuns && cr && (
              <Button variant="outline" icon={Workflow} size="sm" onClick={() => setRunsOpen(true)}>
                Workflow runs
              </Button>
            )}
            {canResubmit && (
              <Link href={ROUTES.PROJECT_CHANGE_REQUEST_EDIT(encoded, cr.id)}>
                <Button icon={PencilLine} size="sm">Edit and resubmit</Button>
              </Link>
            )}
          </>
        }
      />

      <ProjectSummaryCard
        projectCode={projectCode}
        contractName={project.contractName}
        subProjects={project.subProjects}
        loading={project.loading}
      />
      {cr && <ChangeRequestStepper changeRequest={cr} />}

      {error && !cr ? (
        <ErrorNote error={error} onRetry={load} />
      ) : !cr ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : (
        <div className="flex flex-col gap-5">
          {cr.statusId === CR_STATUS.RETURNED && (
            <p className="rounded-xl bg-[#f6f5f3] px-4 py-3 text-xs" style={{ color: CHROME.textSecondary }}>
              Sent back to its requester. It stays open — its items stay locked — until it is changed and sent again,
              or cancelled.
            </p>
          )}
          
          <ChangeRequestOverview changeRequest={cr} />
          <div>
            <FieldChangesTable changes={cr.fieldChanges} />
          </div>
          {cr.cycleChanges.length > 0 && (
            <div>
              <CycleChangesTable changes={cr.cycleChanges} />
            </div>
          )}
          <ChangeRequestTaskPanel changeRequestId={cr.id} onAnswered={load} />
        </div>
      )}
    </div>
  );
}
