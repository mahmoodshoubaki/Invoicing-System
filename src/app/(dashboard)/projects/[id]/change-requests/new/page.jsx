'use client';

import { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { decodeRouteParam } from '@/lib/routeParam';
import Link from 'next/link';
import { MotionConfig } from 'motion/react';
import { ChevronLeft, FileDiff, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';

import SubPageHeader from '@/components/common/SubPageHeader';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ChangeRequestForm from '@/components/changeRequests/form/ChangeRequestForm';
import ProjectSummaryCard from '@/components/projects/ProjectSummaryCard';
import ProjectNotReady from '@/components/projects/ProjectNotReady';
import { mainProjectOf } from '@/lib/changeRequest/projectDraft';
import { useProjectReadiness } from '@/components/projects/useProjectReadiness';
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

export default function NewChangeRequestPage() {
  const { id: rawId } = useParams();
  const t = useTranslations('changeRequests.page');
  const projectCode = decodeRouteParam(rawId);
  const router = useRouter();
  const toast = useToast();
  const { can } = usePermission();
  const data = useChangeRequestPageData(projectCode);
  const readiness = useProjectReadiness(projectCode);
  const existing = useBoqChangeRequests(data.boq?.id ?? null, allow(can, CR_PERMISSIONS.VIEW));

  const encoded = encodeURIComponent(projectCode);
  const tabHref = ROUTES.PROJECT_CHANGE_REQUESTS(encoded);

  const submit = useCallback(async (body, files) => {
    const created = await changeRequestRepository.createChangeRequest({ boqId: data.boq?.id, ...body }, files.added);
    toast.success(t('submitted', { name: created.number || t('eyebrow') }), t('submittedBody'));
    router.push(ROUTES.PROJECT_CHANGE_REQUEST(encoded, created.changeRequestId));
  }, [data.boq?.id, encoded, router, toast, t]);

  let body;
  if (data.loading || !existing.ready || readiness.checking) {
    body = <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>;
  } else if (!readiness.ready) {
    body = <ProjectNotReady missing={readiness.missing} failed={readiness.failed} />;
  } else if (!mainProjectOf(data.subProjects)) {
    body = (
      <p className="flex items-start gap-2 rounded-xl border border-gray-100 bg-white px-4 py-4 text-sm" style={{ color: CHROME.textSecondary }}>
        <Lock size={15} className="mt-0.5 shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
        <span>
          {t('noMainProject', { code: projectCode })}
        </span>
      </p>
    );
  } else if (existing.open) {
    body = (
      <p className="flex items-start gap-2 rounded-xl border border-gray-100 bg-white px-4 py-4 text-sm" style={{ color: CHROME.textSecondary }}>
        <Lock size={15} className="mt-0.5 shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
        <span>
          <Link href={ROUTES.PROJECT_CHANGE_REQUEST(encoded, existing.open.id)} className="font-semibold underline-offset-2 hover:underline">
            {existing.open.number}
          </Link>{' '}
          {t('alreadyOpen')}
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
        submitLabel={t('submitForApproval')}
      />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-7xl">
        <SubPageHeader
          eyebrow={t('eyebrow')}
          title={t('newTitle')}
          icon={FileDiff}
          breadcrumbs={[
            { label: t('home'), href: "/" },
            { label: t('projects'), href: "/projects" },
            {
              label: readiness.header?.contractName ?? projectCode,
              href: ROUTES.PROJECT_DETAIL(encoded),
            },
            { label: t('changeRequests'), href: tabHref },
            { label: t('newCrumb') },
          ]}
          actions={
            <Link href={tabHref}>
              <Button variant="ghost" icon={ChevronLeft} iconClassName="rtl:-scale-x-100" size="sm">
                {t('back')}
              </Button>
            </Link>
          }
        />
        <ProjectSummaryCard projectCode={projectCode} header={readiness.header} status={readiness.status} />
        <ChangeRequestStepper changeRequest={null} />
        {body}
      </div>
    </MotionConfig>
  );
}
