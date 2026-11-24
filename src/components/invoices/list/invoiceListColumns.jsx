import Link from 'next/link';
import { CheckCircle2, Eye } from 'lucide-react';

import Button from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { ROUTES } from '@/constants/routes';
import { isPartiallyCollected } from '@/lib/markCollectedForm';
import { CHROME } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils/formatters';
import CollectedAmountCell from './CollectedAmountCell';

export const invoiceHref = (row) => `${ROUTES.INVOICE_DETAIL(row.id)}?projectCode=${encodeURIComponent(row.projectCode ?? '')}`;

/**
 * @param {{ currency: string, statusesMap: Object, colorsMap: Object, canMarkCollected?: boolean, onMarkCollected?: (row: Object) => void, t: Function, format: Object }} lookups
 */
export function invoiceListColumns({ currency, statusesMap, colorsMap, canMarkCollected = false, onMarkCollected, t, format }) {
  return [
    {
      key: 'invoiceNumber',
      label: t('columns.invoiceNumber'),
      render: (val) => (
        <span dir="auto" className="font-mono text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{val || t('pendingNumber')}</span>
      ),
    },
    {
      key: 'projectCode',
      label: t('columns.project'),
      render: (code) => (code ? (
        <Link
          href={ROUTES.PROJECT_DETAIL(encodeURIComponent(code))}
          onClick={(e) => e.stopPropagation()}
          dir="ltr"
          className="font-mono text-xs underline-offset-2 hover:underline"
        >
          {code}
        </Link>
      ) : '—'),
    },
    {
      key: 'totalAmount',
      label: t('columns.amount'),
      align: 'right',
      render: (val) => (
        <span className="text-sm font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>{formatCurrency(val, currency)}</span>
      ),
    },
    {
      key: 'collectedAmount',
      label: t('columns.collected'),
      align: 'right',
      render: (_, row) => <CollectedAmountCell invoice={row} currency={currency} />,
    },
    {
      key: 'statusId',
      label: t('columns.status'),
      render: (val) => <StatusBadge status={statusesMap[val] ?? '—'} colors={colorsMap[val]} />,
    },
    {
      key: 'submittedByName',
      label: t('columns.submittedBy'),
      render: (val) => <span className="text-sm" style={{ color: CHROME.textSecondary }}>{val || '—'}</span>,
    },
    {
      key: 'submissionDate',
      label: t('columns.submitted'),
      render: (val) => <span className="text-sm" style={{ color: CHROME.textMuted }}>{format.dateTime(val) || '—'}</span>,
    },
    {
      key: 'actions',
      label: '',
      resizable: false,
      width: canMarkCollected ? 164 : 132,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {canMarkCollected && onMarkCollected && isPartiallyCollected(row) && (
            <Button
              variant="ghost"
              size="xs"
              icon={CheckCircle2}
              className="text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={() => onMarkCollected(row)}
              title={t('markCollected')}
              aria-label={t('markOne', { name: row.invoiceNumber ?? t('thisInvoice') })}
            />
          )}
          <Link href={invoiceHref(row)}>
            <Button variant="ghost" size="xs" icon={Eye}>{t('view')}</Button>
          </Link>
        </div>
      ),
    },
  ];
}
