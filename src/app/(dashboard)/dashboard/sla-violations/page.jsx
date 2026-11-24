'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import PageHeader from '@/components/common/PageHeader';
import Table from '@/components/common/Table';
import ErrorNote from '@/components/ui/ErrorNote';
import ProjectStatusSelect from '@/components/dashboard/lists/ProjectStatusSelect';
import { slaViolationColumns, slaViolationHref } from '@/components/dashboard/lists/slaViolationColumns';
import { useSlaViolationsPage } from '@/components/dashboard/lists/useDashboardLists';
import { useProjectStatuses } from '@/components/dashboard/useProjectStatuses';
import { ROUTES } from '@/constants/routes';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { useUrlParam } from '@/hooks/useUrlParam';
import { pageInfo } from '@/lib/pageInfo';

export default function SlaViolationsPage() {
  const t = useTranslations('dashboard');
  const tn = useTranslations('nav');
  const format = useLocaleFormat();
  const router = useRouter();
  const [projectStatus, setProjectStatus] = useUrlParam('projectStatus');
  const statuses = useProjectStatuses();
  const list = useSlaViolationsPage(projectStatus);
  const columns = useMemo(() => slaViolationColumns(t, format), [t, format]);
  const firstLoad = list.loading && list.total === 0;

  return (
    <div>
      <PageHeader
        title={t('sla.pageTitle')}
        subtitle={firstLoad ? t('source.loading') : t('sla.subtitle', { count: list.total })}
        breadcrumbs={[{ label: tn('dashboard'), href: ROUTES.DASHBOARD }, { label: t('sla.pageTitle') }]}
      />
      <div className="mb-4 flex justify-end">
        <ProjectStatusSelect value={projectStatus} onChange={setProjectStatus} statuses={statuses} />
      </div>
      {list.error ? (
        <ErrorNote error={list.error} onRetry={list.reload} />
      ) : (
        <Table
          columns={columns}
          data={list.rows}
          isLoading={list.loading}
          onRowClick={(row) => router.push(slaViolationHref(row))}
          sortable={false}
          emptyMessage={t('sla.pageEmpty')}
          pagination={pageInfo(list.page, list.pageSize, list.total, list.setPage, list.setPageSize)}
        />
      )}
    </div>
  );
}
