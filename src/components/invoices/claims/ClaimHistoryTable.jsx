'use client';

import { memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import Table from '@/components/common/Table';

const text = (value) => (value ? <span dir="auto">{value}</span> : '—');

const historyColumns = (t, format) => [
  { key: 'rowNumber', label: '#', width: 48 },
  { key: 'process', label: t('process'), render: text },
  { key: 'stage', label: t('stage'), render: text },
  { key: 'action', label: t('action'), render: text },
  {
    key: 'actionDate',
    label: t('date'),
    render: (value) => <span className="whitespace-nowrap tabular-nums">{format.dateTime(value) || '—'}</span>,
  },
  {
    key: 'notes',
    label: t('notes'),
    render: (value) => (value ? <span dir="auto" className="whitespace-pre-line">{value}</span> : '—'),
  },
];

/**
 * @param {{ history: object[] }} props
 */
function ClaimHistoryTable({ history }) {
  const t = useTranslations('claims.history');
  const format = useLocaleFormat();
  const rows = useMemo(() => history.map((action, index) => ({ ...action, key: index })), [history]);
  const columns = useMemo(() => historyColumns(t, format), [t, format]);

  return (
    <Table
      columns={columns}
      data={rows}
      rowKey="key"
      sortable={false}
      resizable={true}
      compact
      emptyMessage={t('empty')}
    />
  );
}

export default memo(ClaimHistoryTable);
