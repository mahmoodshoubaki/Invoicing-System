'use client';

import { memo, useMemo } from 'react';
import { Banknote, Network } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Table from '@/components/common/Table';
import { StatusBadge } from '@/components/common/Badge';
import TabToolbar from './TabToolbar';
import { CHROME, SERIES_ROLE } from '@/theme/vizPalette';
import { useProjectStatusLabel } from '@/hooks/useProjectStatusLabel';
import { formatCurrency } from '@/utils/formatters';

function SubProjectsTab({ subProjects, subProjectsLoading, currency }) {
  const t = useTranslations('projects.subProjects');
  const statusLabel = useProjectStatusLabel();
  const money = (v) => formatCurrency(v, currency);

  const totals = useMemo(() => subProjects.reduce(
    (acc, sp) => ({ projectValue: acc.projectValue + (sp.projectValue || 0) }),
    { projectValue: 0 }
  ), [subProjects]);

  const stats = useMemo(() => [
    {
      label: t('count'),
      value: subProjects.length,
      icon: Network,
      accent: SERIES_ROLE.wip,
    },
    {
      label: t('combinedValue'),
      value: money(totals.projectValue),
      icon: Banknote,
      accent: SERIES_ROLE.revenue,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [subProjects.length, totals, currency, t]);

  const columns = useMemo(() => [
    {
      key: 'projectName',
      label: t('columns.projectName'),
      render: (val, row) => (
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight" style={{ color: CHROME.textPrimary }}>
            {val ?? '—'}
          </div>
          <div className="mt-0.5 truncate text-xs" style={{ color: CHROME.textMuted }}>
            <div className="font-mono"><span dir="ltr">{row.projectCode}</span></div>
            {row.projectNameFocus ? `${row.projectNameFocus}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'contractName',
      label: t('columns.contractName'),
      render: (val, row) => (
        <div className="min-w-0">
          <p className="text-sm leading-tight" style={{ color: CHROME.textSecondary }}>{val ?? '—'}</p>
          {row.contractNumber != null && (
            <p className="mt-0.5 font-mono text-xs" style={{ color: CHROME.textMuted }}>
              <span dir="ltr">#{row.contractNumber}</span>
            </p>
          )}
        </div>
      ),
    },
    { key: 'clientName', label: t('columns.client') },
    { key: 'poNumber', label: t('columns.poNumber'), render: (val) => (val ? <span dir="ltr">{val}</span> : '—') },
    { key: 'invoicingPlatform', label: t('columns.invoicingPlatform') },
    {
      key: 'projectValue',
      label: t('columns.projectValue'),
      align: 'right',
      render: (val) => (
        <span className="text-sm font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>
          {money(val)}
        </span>
      ),
    },
    {
      key: 'status',
      label: t('columns.status'),
      sortable: false,
      render: (val) => <StatusBadge status={val} label={statusLabel(val)} />,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [currency, t, statusLabel]);

  return (
    <div>
      <TabToolbar stats={stats} />
      <Table
        columns={columns}
        data={subProjects}
        isLoading={subProjectsLoading}
        rowKey="projectCode"
        emptyMessage={t('empty')}
      />
    </div>
  );
}

export default memo(SubProjectsTab);
