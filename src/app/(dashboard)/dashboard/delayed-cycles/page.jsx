'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import PageHeader from '@/components/common/PageHeader';
import Table from '@/components/common/Table';
import ErrorNote from '@/components/ui/ErrorNote';
import ProjectStatusSelect from '@/components/dashboard/lists/ProjectStatusSelect';
import { delayedCycleColumns, delayedCycleHref } from '@/components/dashboard/lists/delayedCycleColumns';
import { useDelayedCyclesPage } from '@/components/dashboard/lists/useDashboardLists';
import { plural } from '@/components/dashboard/sourceNote';
import { useProjectStatuses } from '@/components/dashboard/useProjectStatuses';
import { ROUTES } from '@/constants/routes';
import { useUrlParam } from '@/hooks/useUrlParam';
import { pageInfo } from '@/lib/pageInfo';

const BREADCRUMBS = [{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Delayed BOQ cycles' }];

export default function DelayedCyclesPage() {
  const router = useRouter();
  const [projectStatus, setProjectStatus] = useUrlParam('projectStatus');
  const statuses = useProjectStatuses();
  const list = useDelayedCyclesPage(projectStatus);
  const columns = useMemo(() => delayedCycleColumns(), []);
  const firstLoad = list.loading && list.total === 0;

  return (
    <div>
      <PageHeader
        title="Delayed BOQ cycles"
        subtitle={firstLoad ? 'Loading…' : `${plural(list.total, 'cycle')} late across ${plural(list.meta.boqCount ?? 0, 'BOQ')}`}
        breadcrumbs={BREADCRUMBS}
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
          emptyMessage="Nothing late — every cycle due so far has an invoice."
          pagination={pageInfo(list.page, list.pageSize, list.total, list.setPage, list.setPageSize)}
        />
      )}
    </div>
  );
}
