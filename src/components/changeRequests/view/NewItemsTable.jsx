'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useTranslations } from 'next-intl';
import { useLookupLabel } from '@/hooks/useLookupLabel';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

import Table from '@/components/common/Table';
import { selectBillingFrequencies } from '@/store/slices/lookupsSlice';
import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils';

/**
 * @param {{ items: Array, projectCode: string }} props
 */
export default function NewItemsTable({ items, projectCode }) {
  const t = useTranslations('changeRequests.newItems');
  const format = useLocaleFormat();
  const frequencyLabel = useLookupLabel('billingFrequency');
  const currency = useSelector((s) => s.ui.currency);
  const frequencies = useSelector(selectBillingFrequencies);
  const frequencyName = (id) => {
    const name = frequencies.find((f) => String(f.id) === String(id))?.label;
    return name ? frequencyLabel(name) : '—';
  };

  const columns = [
    {
      key: 'englishName',
      label: t('item'),
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
    { key: 'quantity', label: t('quantity'), render: (q) => <span className="text-xs tabular-nums">{q}</span> },
    { key: 'unitCost', label: t('unitCost'), render: (c) => <span className="text-xs tabular-nums">{formatCurrency(Number(c) || 0, currency)}</span> },
    {
      key: 'total',
      label: t('total'),
      sortable: false,
      render: (_, row) => <span className="text-xs font-semibold tabular-nums">{formatCurrency((Number(row.quantity) || 0) * (Number(row.unitCost) || 0), currency)}</span>,
    },
    { key: 'billingFrequencyId', label: t('billing'), render: (id) => <span className="text-xs">{frequencyName(id)}</span> },
    { key: 'baselineInvoicingDate', label: t('baselineDate'), render: (d) => <span className="text-xs">{format.date(d) || '—'}</span> },
    {
      key: 'plannedDates',
      label: t('plan'),
      sortable: false,
      render: (dates) => (
        <span className="text-xs" title={dates.map((d) => format.date(d)).join(', ')}>
          {t('cycles', { count: dates.length })}
          {dates.length > 0 && <span style={{ color: CHROME.textMuted }}> · {format.date(dates[0])}{dates.length > 1 ? ` – ${format.date(dates.at(-1))}` : ''}</span>}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5">
      <p className="mb-2 text-sm font-semibold" style={{ color: CHROME.textPrimary }}>{t('title')}</p>
      <Table columns={columns} data={items.map((row, i) => ({ ...row, rowKey: i }))} rowKey="rowKey" compact />
    </div>
  );
}
