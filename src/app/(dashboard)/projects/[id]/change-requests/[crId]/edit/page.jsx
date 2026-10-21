'use client';

import { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MotionConfig } from 'motion/react';
import { ChevronLeft, PencilLine } from 'lucide-react';

import SubPageHeader from '@/components/common/SubPageHeader';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorNote from '@/components/ui/ErrorNote';
import ChangeRequestForm from '@/components/changeRequests/form/ChangeRequestForm';
import ProjectSummaryCard from '@/components/projects/ProjectSummaryCard';
import ChangeRequestStepper from '@/components/changeRequests/progress/ChangeRequestStepper';
import { useChangeRequestPageData } from '@/components/changeRequests/useChangeRequestPageData';
import { useReturnedChangeRequestDraft } from '@/components/changeRequests/useReturnedChangeRequestDraft';
import { changeRequestRepository } from '@/repositories/changeRequestRepository';
import { useToast } from '@/hooks/useToast';
import { CR_STATUS } from '@/constants/changeRequests';
import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';

/**
 * Editing a change request the approver sent back (2026-10-19) —
 * ChangeRequests.Update, and only its requester (the server checks). The form
 * opens with the request as it was sent; Resubmit sends it again whole — what
 * is taken out is dropped.
 */
export default function EditChangeRequestPage() {
  const { id: rawId, crId } = useParams();
  const projectCode = decodeURIComponent(rawId);
  const encoded = encodeURIComponent(projectCode);
  const router = useRouter();
  const toast = useToast();
  const data = useChangeRequestPageData(projectCode);
  const returned = useReturnedChangeRequestDraft(crId, data);
  const cr = returned.changeRequest;
  const viewHref = ROUTES.PROJECT_CHANGE_REQUEST(encoded, crId);

  const submit = useCallback(async (body) => {
    const sent = await changeRequestRepository.updateChangeRequest({ changeRequestId: Number(crId), ...body });
    toast.success(`${sent.number || 'Change request'} sent again`, 'It now waits on the approver again.');
    router.push(viewHref);
  }, [crId, router, toast, viewHref]);

  let body;
  if (returned.error) {
    body = <ErrorNote error={returned.error} />;
  } else if (!cr || !returned.initial) {
    body = <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>;
  } else if (cr.statusId !== CR_STATUS.RETURNED) {
    body = (
      <p className="rounded-xl border border-gray-100 bg-white px-4 py-4 text-sm" style={{ color: CHROME.textSecondary }}>
        {cr.number} can&rsquo;t be edited — only a request the approver sent back can be.{' '}
        <Link href={viewHref} className="font-semibold underline-offset-2 hover:underline">Open it</Link>
      </p>
    );
  } else {
    body = (
      <ChangeRequestForm
        boqItems={data.boqItems}
        statusNameOf={data.statusNameOf}
        subProjects={data.subProjects}
        reasons={data.reasons}
        initial={returned.initial}
        onSubmit={submit}
        cancelHref={viewHref}
        submitLabel="Resubmit for approval"
      />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-4xl">
        <SubPageHeader
          eyebrow="Change request"
          title={cr ? `Edit ${cr.number}` : 'Edit change request'}
          icon={PencilLine}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Projects', href: '/projects' },
            { label: data.project?.contractName ?? projectCode, href: ROUTES.PROJECT_DETAIL(encoded) },
            { label: 'Change requests', href: ROUTES.PROJECT_CHANGE_REQUESTS(encoded) },
            { label: cr?.number ?? '…', href: viewHref },
            { label: 'Edit' },
          ]}
          actions={
            <Link href={viewHref}>
              <Button variant="ghost" icon={ChevronLeft} size="sm">Back</Button>
            </Link>
          }
        />
        <ProjectSummaryCard
          projectCode={projectCode}
          contractName={data.project?.contractName ?? null}
          subProjects={data.subProjects}
          loading={data.loading}
        />
        {cr && <ChangeRequestStepper changeRequest={cr} />}
        {body}
      </div>
    </MotionConfig>
  );
}
