'use client';

import { useMemo, useState } from 'react';

import Table from '@/components/common/Table';
import { controlClass } from '@/components/ui/kit';
import { pageInfo } from '@/lib/pageInfo';
import { CHROME } from '@/theme/vizPalette';

const PAGE_SIZE = 25;
const NO_SHEET = 'Files';

const COLUMNS = [
  { key: 'sheet', label: 'Sheet', render: (sheet) => <span className="text-xs">{sheet ?? NO_SHEET}</span> },
  { key: 'row', label: 'Row', align: 'right', render: (row) => <span className="font-mono text-xs tabular-nums">{row ?? '—'}</span> },
  { key: 'path', label: 'File', render: (path) => <span className="break-all font-mono text-[11px]">{path ?? '—'}</span> },
  { key: 'message', label: 'Problem', render: (message) => <span className="text-xs">{message}</span> },
];

/**
 * @param {{ problems: Array<{ id: number, sheet: string|null, row: number|null, path: string|null, message: string }> }} props
 */
export default function MigrationProblems({ problems }) {
  const [sheet, setSheet] = useState('');
  const [page, setPage] = useState(1);
  const sheets = useMemo(() => [...new Set(problems.map((p) => p.sheet ?? NO_SHEET))].sort(), [problems]);
  const shown = useMemo(
    () => problems
      .filter((p) => !sheet || (p.sheet ?? NO_SHEET) === sheet)
      .sort((a, b) => String(a.sheet ?? NO_SHEET).localeCompare(String(b.sheet ?? NO_SHEET)) || (a.row ?? 0) - (b.row ?? 0)),
    [problems, sheet]
  );
  const current = Math.min(page, Math.max(1, Math.ceil(shown.length / PAGE_SIZE)));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold" style={{ color: CHROME.textPrimary }}>
          {problems.length} problem{problems.length === 1 ? '' : 's'}
        </p>
        {sheets.length > 1 && (
          <select value={sheet} onChange={(e) => { setSheet(e.target.value); setPage(1); }} aria-label="Sheet" className={controlClass}>
            <option value="">Every sheet</option>
            {sheets.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>
      <Table
        columns={COLUMNS}
        data={shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)}
        rowKey="id"
        sortable={false}
        compact
        pagination={pageInfo(current, PAGE_SIZE, shown.length, setPage)}
      />
    </div>
  );
}
