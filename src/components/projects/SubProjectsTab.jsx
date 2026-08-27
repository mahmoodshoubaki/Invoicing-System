'use client';

import { memo, useMemo } from 'react';
import { Activity, Banknote, FileText, Network } from 'lucide-react';
import Table from '@/components/common/Table';
import { StatusBadge } from '@/components/common/Badge';
import TabToolbar from './TabToolbar';
import { CHROME, SERIES_ROLE } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils/formatters';

function SubProjectsTab({ subProjects, subProjectsLoading, currency }) {
  const money = (v) => formatCurrency(v, currency);

  const totals = useMemo(() => subProjects.reduce(
    (acc, sp) => ({
      projectValue: acc.projectValue + (sp.projectValue || 0),
      wip: acc.wip + (sp.wip || 0),
      invoiced: acc.invoiced + (sp.totalInvoicesValue || 0),
    }),
    { projectValue: 0, wip: 0, invoiced: 0 }
  ), [subProjects]);

  const stats = useMemo(() => [
    {
      label: 'Sub-projects',
      value: subProjects.length,
      icon: Network,
      accent: SERIES_ROLE.wip,
    },
    {
      label: 'Combined value',
      value: money(totals.projectValue),
      icon: Banknote,
      accent: SERIES_ROLE.revenue,
    },
    {
      label: 'Total invoiced',
      value: money(totals.invoiced),
      icon: FileText,
      accent: SERIES_ROLE.invoiced,
    },
    {
      label: 'Work in progress',
      value: money(totals.wip),
      icon: Activity,
      accent: SERIES_ROLE.collected,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [subProjects.length, totals, currency]);

  const columns = useMemo(() => [
    {
      key: 'projectName',
      label: 'Project Name',
      render: (val, row) => (
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight" style={{ color: CHROME.textPrimary }}>
            {val ?? '—'}
          </div>
          <div className="mt-0.5 truncate text-xs" style={{ color: CHROME.textMuted }}>
            <div className="font-mono">{row.projectCode}</div>
            {row.projectNameFocus ? `${row.projectNameFocus}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'contractName',
      label: 'Contract Name',
      render: (val, row) => (
        <div className="min-w-0">
          <p className="text-sm leading-tight" style={{ color: CHROME.textSecondary }}>{val ?? '—'}</p>
          {row.contractNumber != null && (
            <p className="mt-0.5 font-mono text-xs" style={{ color: CHROME.textMuted }}>
              #{row.contractNumber}
            </p>
          )}
        </div>
      ),
    },
    { key: 'clientName', label: 'Client' },
    { key: 'poNumber', label: 'PO Number' },
    { key: 'invoicingPlatform', label: 'Invoicing Platform' },
    {
      key: 'projectValue',
      label: 'Project Value',
      align: 'right',
      render: (val) => (
        <span className="text-sm font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>
          {money(val)}
        </span>
      ),
    },
    {
      key: 'wip',
      label: 'WIP',
      align: 'right',
      render: (val) => <span className="text-sm tabular-nums">{money(val)}</span>,
    },
    {
      key: 'totalInvoicesValue',
      label: 'Total Invoiced',
      align: 'right',
      render: (val) => <span className="text-sm tabular-nums">{money(val)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (val) => <StatusBadge status={val} />,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [currency]);

  return (
    <div>
      <TabToolbar stats={stats} />
      <Table
        columns={columns}
        data={subProjects}
        isLoading={subProjectsLoading}
        rowKey="projectCode"
        emptyMessage="No sub-projects are linked to this contract."
      />
    </div>
  );
}

export default memo(SubProjectsTab);
