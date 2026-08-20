'use client';

import { memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Banknote, Clock, Edit2, Eye, FileText, Plus } from 'lucide-react';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import { StatusBadge } from '@/components/common/Badge';
import TabToolbar from './TabToolbar';
import { CHROME, SERIES_ROLE, STATUS } from '@/theme/vizPalette';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { usePermission } from '@/hooks/usePermission';
import { INVOICE_STATUS } from '@/constants/statuses';

function InvoicesTab({ projectCode, invoices, invoicesLoading, invoiceStatusesMap, invoiceStatusColorsMap, currency }) {
  const router = useRouter();
  const { can } = usePermission();
  const money = (v) => formatCurrency(v, currency);
  const encoded = encodeURIComponent(projectCode);

  const summary = useMemo(() => {
    const totalAmount = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const pending = invoices.filter((i) => {
      const label = invoiceStatusesMap[i.statusId];
      return label === INVOICE_STATUS.SUBMITTED || label === INVOICE_STATUS.UNDER_REVIEW;
    }).length;
    return { totalAmount, pending };
  }, [invoices, invoiceStatusesMap]);

  const stats = useMemo(() => [
    {
      label: 'Invoices',
      value: invoices.length,
      icon: FileText,
      accent: SERIES_ROLE.invoiced,
    },
    {
      label: 'Total raised',
      value: money(summary.totalAmount),
      icon: Banknote,
      accent: SERIES_ROLE.revenue,
    },
    {
      label: 'Awaiting action',
      value: summary.pending,
      icon: Clock,
      accent: STATUS.warning,
      valueColor: summary.pending > 0 ? '#b07800' : undefined,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [invoices.length, summary, currency]);

  const columns = useMemo(() => [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      render: (val) => (
        <span className="font-mono text-xs font-semibold" style={{ color: CHROME.textPrimary }}>
          {val ?? '—'}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      align: 'right',
      render: (val) => (
        <span className="text-sm font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>
          {money(val)}
        </span>
      ),
    },
    {
      key: 'statusId',
      label: 'Status',
      sortable: false,
      render: (val) => (
        <StatusBadge status={invoiceStatusesMap[val] ?? '—'} colors={invoiceStatusColorsMap[val]} />
      ),
    },
    {
      key: 'submittedBy',
      label: 'Submitted By',
      render: (val) => (
        <span className="text-sm" style={{ color: CHROME.textSecondary }}>{val || '—'}</span>
      ),
    },
    {
      key: 'submissionDate',
      label: 'Submitted',
      render: (val) => (
        <span className="text-sm" style={{ color: CHROME.textMuted }}>{formatDateTime(val) || '—'}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      resizable: false,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          {can('Invoices', 'Update') && (
            <Link href={`/projects/${encoded}/invoices/${row.id}/edit`}>
              <Button variant="ghost" size="xs" icon={Edit2} title="Edit invoice" />
            </Link>
          )}
          <Link href={`/invoices/${row.id}?projectCode=${encoded}`}>
            <Button variant="ghost" size="xs" icon={Eye} title="View invoice" />
          </Link>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [currency, invoiceStatusesMap, invoiceStatusColorsMap, can, encoded]);

  const actions = can('Invoices', 'Create') ? (
    <Link href={`/projects/${encoded}/invoices/new`}>
      <Button size="sm" icon={Plus}>New invoice request</Button>
    </Link>
  ) : null;

  return (
    <div>
      <TabToolbar stats={stats} actions={actions} />

      <Table
        columns={columns}
        data={invoices}
        isLoading={invoicesLoading}
        rowKey="id"
        onRowClick={(row) => router.push(`/invoices/${row.id}?projectCode=${encoded}`)}
        emptyMessage="No invoice requests have been raised for this project yet."
      />
    </div>
  );
}

export default memo(InvoicesTab);
