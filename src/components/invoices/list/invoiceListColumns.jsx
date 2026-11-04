import Link from 'next/link';
import { Eye } from 'lucide-react';

import Button from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { PENDING_LABEL } from '@/utils/invoiceDisplay';

export const invoiceHref = (row) => `${ROUTES.INVOICE_DETAIL(row.id)}?projectCode=${encodeURIComponent(row.projectCode ?? '')}`;

/**
 * @param {{ currency: string, statusesMap: Object, colorsMap: Object }} lookups
 */
export function invoiceListColumns({ currency, statusesMap, colorsMap }) {
  return [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      render: (val) => (
        <span className="font-mono text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{val || PENDING_LABEL}</span>
      ),
    },
    {
      key: 'projectCode',
      label: 'Project',
      render: (code) => (code ? (
        <Link
          href={ROUTES.PROJECT_DETAIL(encodeURIComponent(code))}
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-xs underline-offset-2 hover:underline"
        >
          {code}
        </Link>
      ) : '—'),
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      align: 'right',
      render: (val) => (
        <span className="text-sm font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>{formatCurrency(val, currency)}</span>
      ),
    },
    {
      key: 'statusId',
      label: 'Status',
      render: (val) => <StatusBadge status={statusesMap[val] ?? '—'} colors={colorsMap[val]} />,
    },
    {
      key: 'submittedByName',
      label: 'Submitted by',
      render: (val) => <span className="text-sm" style={{ color: CHROME.textSecondary }}>{val || '—'}</span>,
    },
    {
      key: 'submissionDate',
      label: 'Submitted',
      render: (val) => <span className="text-sm" style={{ color: CHROME.textMuted }}>{formatDateTime(val) || '—'}</span>,
    },
    {
      key: 'actions',
      label: '',
      resizable: false,
      render: (_, row) => (
        <Link href={invoiceHref(row)} onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="xs" icon={Eye}>View</Button>
        </Link>
      ),
    },
  ];
}
