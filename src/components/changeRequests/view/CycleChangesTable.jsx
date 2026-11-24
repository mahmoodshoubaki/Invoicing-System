'use client';

import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import Table from '@/components/common/Table';
import { CHROME, STATUS } from '@/theme/vizPalette';

const KIND_COLORS = { Added: STATUS.good, Moved: STATUS.info, Removed: STATUS.critical };

/**
 * @param {{ changes: Array }} props
 */
export default function CycleChangesTable({ changes }) {
  const t = useTranslations('changeRequests.cycles');
  const tk = useTranslations('changeRequests.kinds');
  const format = useLocaleFormat();
  const columns = [
    { key: 'boqItemName', label: t('item'), render: (name, c) => <span className="text-xs" style={{ color: CHROME.textPrimary }}>{name || t('itemFallback', { id: c.boqItemId })}</span> },
    {
      key: 'changeKind',
      label: t('change'),
      render: (kind) => <span className="text-xs font-semibold" style={{ color: KIND_COLORS[kind] ?? CHROME.textSecondary }}>{kind ? (tk.has(kind) ? tk(kind) : kind) : '—'}</span>,
    },
    {
      key: 'oldPlannedDate',
      label: t('from'),
      render: (date) => <span className="text-xs line-through" style={{ color: CHROME.textMuted }}>{date ? format.date(date) : '—'}</span>,
    },
    {
      key: 'newPlannedDate',
      label: t('to'),
      render: (date) => <span className="text-xs font-medium" style={{ color: CHROME.textPrimary }}>{date ? format.date(date) : '—'}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5">
      <p
        className="mb-2 text-sm font-semibold"
        style={{ color: CHROME.textPrimary }}
      >
        {t('title')}
      </p>

      <Table
        columns={columns}
        data={changes.map((c, i) => ({
          ...c,
          rowId: `${c.boqItemId}:${c.cycleId ?? "new"}:${i}`,
        }))}
        rowKey="rowId"
        sortable={false}
        resizable={false}
        compact
        emptyMessage={t('empty')}
      />
    </div>
  );
}
