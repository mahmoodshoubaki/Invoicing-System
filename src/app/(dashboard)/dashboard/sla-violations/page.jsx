'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import PageHeader from '@/components/common/PageHeader';
import Table from '@/components/common/Table';
import ErrorNote from '@/components/ui/ErrorNote';
import ProjectStatusSelect from '@/components/dashboard/lists/ProjectStatusSelect';
import { slaViolationColumns, slaViolationHref } from '@/components/dashboard/lists/slaViolationColumns';
import { useSlaViolationsPage } from '@/components/dashboard/lists/useDashboardLists';
import { plural } from '@/components/dashboard/sourceNote';
import { useProjectStatuses } from '@/components/dashboard/useProjectStatuses';
import { ROUTES } from '@/constants/routes';
import { useUrlParam } from '@/hooks/useUrlParam';
import { pageInfo } from '@/lib/pageInfo';

const BREADCRUMBS = [{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'SLA violations' }];

export default function SlaViolationsPage() {
  const router = useRouter();
  const [projectStatus, setProjectStatus] = useUrlParam('projectStatus');
  const statuses = useProjectStatuses();
  const list = useSlaViolationsPage(projectStatus);
  const columns = useMemo(() => slaViolationColumns(), []);
  const firstLoad = list.loading && list.total === 0;

  return (
    <div>
      <PageHeader
        title="SLA violations"
        subtitle={firstLoad ? 'Loading…' : `${plural(list.total, 'task')} past due`}
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
          onRowClick={(row) => router.push(slaViolationHref(row))}
          sortable={false}
          emptyMessage="Nothing past due — every open task is within its due date."
          pagination={pageInfo(list.page, list.pageSize, list.total, list.setPage, list.setPageSize)}
        />
      )}
    </div>
  );
}
