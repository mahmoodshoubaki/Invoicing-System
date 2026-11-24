'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSelector } from 'react-redux';

import PageHeader from '@/components/common/PageHeader';
import Table from '@/components/common/Table';
import ErrorNote from '@/components/ui/ErrorNote';
import PillTabs from '@/components/ui/PillTabs';
import ProjectStatusSelect from '@/components/dashboard/lists/ProjectStatusSelect';
import { pendingApprovalColumns } from '@/components/dashboard/lists/pendingApprovalColumns';
import { PENDING_TYPES, pendingHref, pendingTypeName } from '@/components/dashboard/lists/pendingTypes';
import { usePendingApprovalsPage } from '@/components/dashboard/lists/useDashboardLists';
import { useProjectStatuses } from '@/components/dashboard/useProjectStatuses';
import { ROUTES } from '@/constants/routes';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { useUrlParam } from '@/hooks/useUrlParam';
import { pageInfo } from '@/lib/pageInfo';

export default function PendingApprovalsPage() {
  const t = useTranslations('dashboard');
  const tn = useTranslations('nav');
  const format = useLocaleFormat();
  const router = useRouter();
  const currency = useSelector((s) => s.ui.currency);
  const [projectStatus, setProjectStatus] = useUrlParam('projectStatus');
  const [type, setType] = useUrlParam('type');
  const statuses = useProjectStatuses();
  const list = usePendingApprovalsPage(projectStatus, type);
  const columns = useMemo(() => pendingApprovalColumns({ currency, t, format }), [currency, t, format]);

  const byType = list.meta.byType ?? [];
  const all = byType.reduce((sum, entry) => sum + entry.count, 0);
  const tabs = [
    { key: '', label: t('pending.all'), count: list.meta.byType ? all : null },
    ...PENDING_TYPES.filter((k) => byType.some((entry) => entry.type === k.type))
      .map((k) => ({ key: k.type, label: pendingTypeName(t, k.type, 'label'), count: byType.find((entry) => entry.type === k.type).count })),
  ];
  const firstLoad = list.loading && !list.meta.byType;

  return (
    <div>
      <PageHeader
        title={t('pending.pageTitle')}
        subtitle={firstLoad ? t('source.loading') : t('pending.subtitle', { count: all })}
        breadcrumbs={[{ label: tn('dashboard'), href: ROUTES.DASHBOARD }, { label: t('pending.pageTitle') }]}
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
          emptyMessage={t('pending.pageEmpty')}
          pagination={pageInfo(list.page, list.pageSize, list.total, list.setPage, list.setPageSize)}
        />
      )}
    </div>
  );
}
