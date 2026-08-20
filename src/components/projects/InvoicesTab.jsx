'use client';

import { memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit2, Eye } from 'lucide-react';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import { StatusBadge } from '@/components/common/Badge';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { usePermission } from '@/hooks/usePermission';

function InvoicesTab({ projectCode, invoices, invoicesLoading, invoiceStatusesMap, invoiceStatusColorsMap, currency }) {
  const router = useRouter();
  const { can } = usePermission();

  const columns = useMemo(() => [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-gray-700">{val}</span>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      align: 'center',
      render: (val) => <span className="font-semibold">{formatCurrency(val, currency)}</span>,
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
      render: (val) => val || '—',
    },
    {
      key: 'submissionDate',
      label: 'Submitted Date',
      render: (val) => formatDateTime(val),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div onClick={(e) => e.stopPropagation()}>
          {can('Invoices', 'Update') && (
            <Link href={`/projects/${encodeURIComponent(projectCode)}/invoices/${row.id}/edit`}>
              <Button variant="ghost" icon={Edit2} size="sm" />
            </Link>
          )}
          <Link href={`/invoices/${row.id}?projectCode=${encodeURIComponent(projectCode)}`}>
            <Button variant="ghost" size="sm" icon={Eye} />
          </Link>
        </div>
      ),
    },
  ], [currency, invoiceStatusesMap, invoiceStatusColorsMap, can, projectCode]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
        {can('Invoices', 'Create') && (
          <Link href={`/projects/${encodeURIComponent(projectCode)}/invoices/new`}>
            <Button size="sm">New Invoice Request</Button>
          </Link>
        )}
      </div>
      <Table
        columns={columns}
        data={invoices}
        isLoading={invoicesLoading}
        onRowClick={(row) => router.push(`/invoices/${row.id}?projectCode=${encodeURIComponent(projectCode)}`)}
        emptyMessage="No invoice requests for this project"
      />
    </div>
  );
}

export default memo(InvoicesTab);
