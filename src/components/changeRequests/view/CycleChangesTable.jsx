'use client';

import Table from '@/components/common/Table';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { formatDate } from '@/utils';

const KIND_COLORS = { Added: STATUS.good, Moved: STATUS.info, Removed: STATUS.critical };

/**
 * The invoicing plan changes of a request, cycle by cycle: each one Added,
 * Moved or Removed, with its old and new planned dates.
 *
 * @param {{ changes: Array }} props
 */
export default function CycleChangesTable({ changes }) {
  const columns = [
    { key: 'boqItemName', label: 'Item', render: (name, c) => <span className="text-xs" style={{ color: CHROME.textPrimary }}>{name || `Item ${c.boqItemId}`}</span> },
    {
      key: 'changeKind',
      label: 'Change',
      render: (kind) => <span className="text-xs font-semibold" style={{ color: KIND_COLORS[kind] ?? CHROME.textSecondary }}>{kind || '—'}</span>,
    },
    {
      key: 'oldPlannedDate',
      label: 'From',
      render: (date) => <span className="text-xs line-through" style={{ color: CHROME.textMuted }}>{date ? formatDate(date) : '—'}</span>,
    },
    {
      key: 'newPlannedDate',
      label: 'To',
      render: (date) => <span className="text-xs font-medium" style={{ color: CHROME.textPrimary }}>{date ? formatDate(date) : '—'}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5">
      <p
        className="mb-2 text-sm font-semibold"
        style={{ color: CHROME.textPrimary }}
      >
        Invoicing plan changes
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
        emptyMessage="No invoicing plan changes."
      />
    </div>
  );
}
