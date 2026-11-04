'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';

import Table from '@/components/common/Table';
import { selectBillingFrequencies } from '@/store/slices/lookupsSlice';
import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';
import { formatCurrency, formatDate } from '@/utils';

/**
 * The BOQ items a request adds; once approved, each links to the item it became.
 *
 * @param {{ items: Array, projectCode: string }} props
 */
export default function NewItemsTable({ items, projectCode }) {
  const currency = useSelector((s) => s.ui.currency);
  const frequencies = useSelector(selectBillingFrequencies);
  const frequencyName = (id) => frequencies.find((f) => String(f.id) === String(id))?.label ?? '—';

  const columns = [
    {
      key: 'englishName',
      label: 'Item',
      render: (name, row) => (
        <div className="min-w-0">
          {row.createdBoqItemId ? (
            <Link
              href={ROUTES.PROJECT_BOQ_ITEM(encodeURIComponent(projectCode), row.createdBoqItemId)}
              className="text-xs font-semibold underline-offset-2 hover:underline"
            >
              {name}
            </Link>
          ) : (
            <span className="text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{name}</span>
          )}
          <p className="text-[11px]" dir="rtl" style={{ color: CHROME.textMuted }}>{row.arabicName}</p>
        </div>
      ),
    },
    { key: 'quantity', label: 'Quantity', render: (q) => <span className="text-xs tabular-nums">{q}</span> },
    { key: 'unitCost', label: 'Unit cost', render: (c) => <span className="text-xs tabular-nums">{formatCurrency(Number(c) || 0, currency)}</span> },
    {
      key: 'total',
      label: 'Total',
      sortable: false,
      render: (_, row) => <span className="text-xs font-semibold tabular-nums">{formatCurrency((Number(row.quantity) || 0) * (Number(row.unitCost) || 0), currency)}</span>,
    },
    { key: 'billingFrequencyId', label: 'Billing', render: (id) => <span className="text-xs">{frequencyName(id)}</span> },
    { key: 'baselineInvoicingDate', label: 'Baseline date', render: (d) => <span className="text-xs">{formatDate(d) || '—'}</span> },
    {
      key: 'plannedDates',
      label: 'Plan',
      sortable: false,
      render: (dates) => (
        <span className="text-xs" title={dates.map(formatDate).join(', ')}>
          {dates.length} cycle{dates.length === 1 ? '' : 's'}
          {dates.length > 0 && <span style={{ color: CHROME.textMuted }}> · {formatDate(dates[0])}{dates.length > 1 ? ` – ${formatDate(dates.at(-1))}` : ''}</span>}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5">
      <p className="mb-2 text-sm font-semibold" style={{ color: CHROME.textPrimary }}>New BOQ items</p>
      <Table columns={columns} data={items.map((row, i) => ({ ...row, rowKey: i }))} rowKey="rowKey" compact />
    </div>
  );
}
