'use client';

import { memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils/formatters';

/**
 * @param {{ payments: Array<{ id: number, amount: number, collectedDate: string|null, createdOn: string|null }>, currency: string }} props
 */
function InvoicePaymentsCard({ payments, currency }) {
  const t = useTranslations('invoices.payments');
  const format = useLocaleFormat();
  const rows = useMemo(() => payments.map((payment, index) => ({ ...payment, number: index + 1 })), [payments]);

  const columns = useMemo(() => [
    {
      key: 'number',
      label: '#',
      width: 48,
      render: (value) => <span className="text-xs tabular-nums" style={{ color: CHROME.textMuted }}>{value}</span>,
    },
    {
      key: 'amount',
      label: t('amount'),
      align: 'right',
      render: (value) => (
        <span className="text-sm font-semibold tabular-nums" style={{ color: value < 0 ? STATUS.critical : CHROME.textPrimary }}>
          {formatCurrency(value, currency)}
        </span>
      ),
    },
    {
      key: 'collectedDate',
      label: t('collectedDate'),
      render: (value) => <span className="text-sm tabular-nums">{format.date(value) || '—'}</span>,
    },
    {
      key: 'createdOn',
      label: t('recordedOn'),
      render: (value) => <span className="text-sm tabular-nums" style={{ color: CHROME.textMuted }}>{format.dateTime(value) || '—'}</span>,
    },
  ], [currency, t, format]);

  if (payments.length === 0) return null;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
        {t('title', { count: payments.length })}
      </h3>
      <Table columns={columns} data={rows} rowKey="id" sortable={false} resizable={false} compact />
    </Card>
  );
}

export default memo(InvoicePaymentsCard);
