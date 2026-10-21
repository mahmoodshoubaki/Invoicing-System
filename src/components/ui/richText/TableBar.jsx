'use client';

import {
  BetweenHorizontalEnd, BetweenHorizontalStart, BetweenVerticalEnd, BetweenVerticalStart, Columns3, PanelTop, Rows3,
  TableCellsMerge, TableCellsSplit, Trash2,
} from 'lucide-react';

import { CHROME } from '@/theme/vizPalette';
import { Divider, TableAction } from './toolbarParts';

/**
 * While the cursor is in a table: its rows, columns and cells.
 *
 * @param {{ chain: () => Object, canMerge: boolean, canSplit: boolean }} props
 *   `chain` starts a focused editor command chain.
 */
export default function TableBar({ chain, canMerge, canSplit }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-t border-[#f1f0ee] px-2 py-1">
      <span className="mr-1 text-[11px] font-semibold" style={{ color: CHROME.textPrimary }}>Table</span>
      <TableAction icon={BetweenHorizontalStart} label="Row above" onClick={() => chain().addRowBefore().run()} />
      <TableAction icon={BetweenHorizontalEnd} label="Row below" onClick={() => chain().addRowAfter().run()} />
      <TableAction icon={BetweenVerticalStart} label="Column before" onClick={() => chain().addColumnBefore().run()} />
      <TableAction icon={BetweenVerticalEnd} label="Column after" onClick={() => chain().addColumnAfter().run()} />
      <Divider />
      <TableAction icon={PanelTop} label="Header row" onClick={() => chain().toggleHeaderRow().run()} />
      <TableAction icon={TableCellsMerge} label="Merge cells" disabled={!canMerge} onClick={() => chain().mergeCells().run()} />
      <TableAction icon={TableCellsSplit} label="Split cell" disabled={!canSplit} onClick={() => chain().splitCell().run()} />
      <Divider />
      <TableAction icon={Rows3} label="Delete row" danger onClick={() => chain().deleteRow().run()} />
      <TableAction icon={Columns3} label="Delete column" danger onClick={() => chain().deleteColumn().run()} />
      <TableAction icon={Trash2} label="Delete table" danger onClick={() => chain().deleteTable().run()} />
    </div>
  );
}
