'use client';

import { memo, useMemo, useState } from 'react';
import { Banknote, FileText, History, Landmark, RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import Button from '@/components/common/Button';
import Table, { sortRows } from '@/components/common/Table';
import { StatusBadge } from '@/components/common/Badge';
import ClaimHistoryModal from '@/components/invoices/claims/ClaimHistoryModal';
import TabToolbar from './TabToolbar';
import { CHROME, SERIES_ROLE } from '@/theme/vizPalette';
import { pageInfo } from '@/lib/pageInfo';
import { formatCurrencyAs } from '@/utils/formatters';

const PAGE_SIZE = 10;
const NO_CLAIMS = [];

const claimColumns = (t, format) => [
  {
    key: 'referenceNumber',
    label: t('columns.reference'),
    render: (value) => (
      <span dir="ltr" className="font-mono text-sm font-semibold" style={{ color: CHROME.textPrimary }}>{value ?? '—'}</span>
    ),
  },
  {
    key: 'dateView',
    label: t('columns.date'),
    render: (value) => <span className="text-sm tabular-nums">{format.date(value) || '—'}</span>,
  },
  {
    key: 'status',
    label: t('columns.status'),
    render: (value) => (value ? <StatusBadge status={value} /> : '—'),
  },
  {
    key: 'amountInRiyal',
    label: t('columns.riyal'),
    align: 'right',
    render: (value) => (
      <span className="text-sm font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>
        {formatCurrencyAs(value, 'SAR')}
      </span>
    ),
  },
  {
    key: 'amountInDollars',
    label: t('columns.dollars'),
    align: 'right',
    render: (value) => (
      <span className="text-sm font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>
        {formatCurrencyAs(value, 'USD')}
      </span>
    ),
  },
];

/**
 * Shown only for projects on an Etimad contract.
 * @param {{ data: { isEtimadContract: boolean, contractNumber: number|null, claims: object[] }|null, loading: boolean, error: Error|null, onRetry: () => void }} props
 */
function FinancialClaimsTab({ data, loading, error, onRetry }) {
  const t = useTranslations('claims.tab');
  const format = useLocaleFormat();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ col: 'dateView', dir: 'desc' });
  const [historyReference, setHistoryReference] = useState(null);

  const columns = useMemo(() => [
    ...claimColumns(t, format),
    {
      key: 'actions',
      label: '',
      sortable: false,
      resizable: false,
      render: (_, row) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="xs"
            icon={History}
            onClick={() => setHistoryReference(row.referenceNumber)}
            title={t('etimadHistory')}
          />
        </div>
      ),
    },
  ], [t, format]);

  const claims = data?.claims ?? NO_CLAIMS;
  const sorted = useMemo(() => sortRows(claims, sort.col, sort.dir), [claims, sort]);
  const pagination = pageInfo(page, PAGE_SIZE, sorted.length, setPage);
  const current = pagination?.page ?? 1;
  const rows = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const totalAmount = useMemo(() => claims.reduce((sum, claim) => sum + (claim.amountInRiyal ?? 0), 0), [claims]);

  const stats = [
    {
      label: t('stats.contract'),
      value: <span dir="ltr" className="font-mono">{data?.contractNumber ?? '—'}</span>,
      icon: Landmark,
      accent: SERIES_ROLE.wip,
    },
    {
      label: t('stats.claims'),
      value: data ? claims.length : '—',
      icon: FileText,
      accent: SERIES_ROLE.invoiced,
    },
    {
      label: t('stats.total'),
      value: data ? formatCurrencyAs(totalAmount, 'SAR') : '—',
      icon: Banknote,
      accent: SERIES_ROLE.revenue,
    },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
        <p className="text-sm text-red-700">{error.message || t('loadFailed')}</p>
        <Button variant="outline" size="sm" icon={RotateCw} loading={loading} onClick={onRetry}>{t('tryAgain')}</Button>
      </div>
    );
  }

  return (
    <div>
      <ClaimHistoryModal reference={historyReference} onClose={() => setHistoryReference(null)} />
      <TabToolbar stats={stats} />
      <Table
        columns={columns}
        data={rows}
        isLoading={loading}
        rowKey="referenceNumber"
        sort={sort}
        resizable={true}
        onSortChange={(next) => { setSort(next); setPage(1); }}
        pagination={pagination}
        emptyMessage={t('empty')}
      />
    </div>
  );
}

export default memo(FinancialClaimsTab);
