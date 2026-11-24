'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import PageHeader from '@/components/common/PageHeader';
import Table from '@/components/common/Table';
import ErrorNote from '@/components/ui/ErrorNote';
import ProjectStatusSelect from '@/components/dashboard/lists/ProjectStatusSelect';
import { delayedCycleColumns, delayedCycleHref } from '@/components/dashboard/lists/delayedCycleColumns';
import { useDelayedCyclesPage } from '@/components/dashboard/lists/useDashboardLists';
import { useProjectStatuses } from '@/components/dashboard/useProjectStatuses';
import { ROUTES } from '@/constants/routes';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { useUrlParam } from '@/hooks/useUrlParam';
import { pageInfo } from '@/lib/pageInfo';

export default function DelayedCyclesPage() {
  const t = useTranslations('dashboard');
  const tn = useTranslations('nav');
  const format = useLocaleFormat();
  const router = useRouter();
  const [projectStatus, setProjectStatus] = useUrlParam('projectStatus');
  const statuses = useProjectStatuses();
  const list = useDelayedCyclesPage(projectStatus);
  const columns = useMemo(() => delayedCycleColumns(t, format), [t, format]);
  const firstLoad = list.loading && list.total === 0;

  return (
    <div>
      <PageHeader
        title={t('delayed.pageTitle')}
        subtitle={firstLoad ? t('source.loading') : t('delayed.subtitle', { cycles: list.total, boqs: list.meta.boqCount ?? 0 })}
        breadcrumbs={[{ label: tn('dashboard'), href: ROUTES.DASHBOARD }, { label: t('delayed.pageTitle') }]}
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
          onRowClick={(row) => router.push(delayedCycleHref(row))}
          sortable={false}
          emptyMessage={t('delayed.pageEmpty')}
          pagination={pageInfo(list.page, list.pageSize, list.total, list.setPage, list.setPageSize)}
        />
      )}
    </div>
  );
}
