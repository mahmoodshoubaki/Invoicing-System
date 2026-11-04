'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

import PageHeader from '@/components/common/PageHeader';
import Table from '@/components/common/Table';
import ErrorNote from '@/components/ui/ErrorNote';
import PillTabs from '@/components/ui/PillTabs';
import ProjectStatusSelect from '@/components/dashboard/lists/ProjectStatusSelect';
import { pendingApprovalColumns } from '@/components/dashboard/lists/pendingApprovalColumns';
import { PENDING_TYPES, pendingHref } from '@/components/dashboard/lists/pendingTypes';
import { usePendingApprovalsPage } from '@/components/dashboard/lists/useDashboardLists';
import { plural } from '@/components/dashboard/sourceNote';
import { useProjectStatuses } from '@/components/dashboard/useProjectStatuses';
import { ROUTES } from '@/constants/routes';
import { useUrlParam } from '@/hooks/useUrlParam';
import { pageInfo } from '@/lib/pageInfo';

const BREADCRUMBS = [{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Pending approvals' }];

export default function PendingApprovalsPage() {
  const router = useRouter();
  const currency = useSelector((s) => s.ui.currency);
  const [projectStatus, setProjectStatus] = useUrlParam('projectStatus');
  const [type, setType] = useUrlParam('type');
  const statuses = useProjectStatuses();
  const list = usePendingApprovalsPage(projectStatus, type);
  const columns = useMemo(() => pendingApprovalColumns({ currency }), [currency]);

  const byType = list.meta.byType ?? [];
  const all = byType.reduce((sum, t) => sum + t.count, 0);
  const tabs = [
    { key: '', label: 'All', count: list.meta.byType ? all : null },
    ...PENDING_TYPES.filter((k) => byType.some((t) => t.type === k.type))
      .map((k) => ({ key: k.type, label: k.label, count: byType.find((t) => t.type === k.type).count })),
  ];
  const firstLoad = list.loading && !list.meta.byType;

  return (
    <div>
      <PageHeader
        title="Pending approvals"
        subtitle={firstLoad ? 'Loading…' : `${plural(all, 'request')} not finished yet`}
        breadcrumbs={BREADCRUMBS}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PillTabs tabs={tabs} value={type} onChange={setType} />
        <ProjectStatusSelect value={projectStatus} onChange={setProjectStatus} statuses={statuses} />
      </div>
      {list.error ? (
        <ErrorNote error={list.error} onRetry={list.reload} />
      ) : (
        <Table
          columns={columns}
          data={list.rows}
          rowKey="key"
          isLoading={list.loading}
          onRowClick={(row) => router.push(pendingHref(row))}
          sortable={false}
          emptyMessage="Nothing waiting for a decision."
          pagination={pageInfo(list.page, list.pageSize, list.total, list.setPage, list.setPageSize)}
        />
      )}
    </div>
  );
}
