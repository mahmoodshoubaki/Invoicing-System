'use client';

import { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MotionConfig } from 'motion/react';
import { ChevronLeft, FileDiff, Lock } from 'lucide-react';

import SubPageHeader from '@/components/common/SubPageHeader';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ChangeRequestForm from '@/components/changeRequests/form/ChangeRequestForm';
import ProjectSummaryCard from '@/components/projects/ProjectSummaryCard';
import ChangeRequestStepper from '@/components/changeRequests/progress/ChangeRequestStepper';
import { useChangeRequestPageData } from '@/components/changeRequests/useChangeRequestPageData';
import { useBoqChangeRequests } from '@/components/changeRequests/useBoqChangeRequests';
import { changeRequestRepository } from '@/repositories/changeRequestRepository';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
import { allow } from '@/constants/workflowPermissions';
import { CR_PERMISSIONS } from '@/constants/changeRequests';
import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';

/**
 * Raising a change request on a project's BOQ (2026-10-19) —
 * ChangeRequests.Create. Only one may be open on a BOQ at a time, so with one
 * already open the page says so and links to it instead of offering the form.
 */
export default function NewChangeRequestPage() {
  // See boq/page.jsx for why this is decoded defensively.
  const { id: rawId } = useParams();
  const projectCode = decodeURIComponent(rawId);
  const router = useRouter();
  const toast = useToast();
  const { can } = usePermission();
  const data = useChangeRequestPageData(projectCode);
  const existing = useBoqChangeRequests(data.boq?.id ?? null, allow(can, CR_PERMISSIONS.VIEW));

  const encoded = encodeURIComponent(projectCode);
  const tabHref = ROUTES.PROJECT_CHANGE_REQUESTS(encoded);

  const submit = useCallback(async (body) => {
    const created = await changeRequestRepository.createChangeRequest({ boqId: data.boq?.id, ...body });
    toast.success(`${created.number || 'Change request'} submitted`, 'It now waits on the approver. Its items are locked until it is decided.');
    router.push(ROUTES.PROJECT_CHANGE_REQUEST(encoded, created.changeRequestId));
  }, [data.boq?.id, encoded, router, toast]);

  let body;
  if (data.loading || !existing.ready) {
    body = <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>;
  } else if (existing.open) {
    body = (
      <p className="flex items-start gap-2 rounded-xl border border-gray-100 bg-white px-4 py-4 text-sm" style={{ color: CHROME.textSecondary }}>
        <Lock size={15} className="mt-0.5 shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
        <span>
          <Link href={ROUTES.PROJECT_CHANGE_REQUEST(encoded, existing.open.id)} className="font-semibold underline-offset-2 hover:underline">
            {existing.open.number}
          </Link>{' '}
          is still open on this BOQ, and only one change request can be open at a time. It has to be approved,
          rejected or cancelled before another is raised.
        </span>
      </p>
    );
  } else {
    body = (
      <ChangeRequestForm
        boqItems={data.boqItems}
        statusNameOf={data.statusNameOf}
        subProjects={data.subProjects}
        reasons={data.reasons}
        onSubmit={submit}
        cancelHref={tabHref}
        submitLabel="Submit for approval"
      />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-6xl">
        <SubPageHeader
          eyebrow="Change request"
          title="New change request"
          icon={FileDiff}
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Projects", href: "/projects" },
            {
              label: data.project?.contractName ?? projectCode,
              href: ROUTES.PROJECT_DETAIL(encoded),
            },
            { label: "Change requests", href: tabHref },
            { label: "New" },
          ]}
          actions={
            <Link href={tabHref}>
              <Button variant="ghost" icon={ChevronLeft} size="sm">
                Back
              </Button>
            </Link>
          }
        />
        <ProjectSummaryCard
          projectCode={projectCode}
          contractName={data.project?.contractName ?? null}
          subProjects={data.subProjects}
          loading={data.loading}
        />
        <ChangeRequestStepper changeRequest={null} />
        {body}
      </div>
    </MotionConfig>
  );
}
