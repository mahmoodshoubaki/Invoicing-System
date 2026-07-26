'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

const MIN_COL_WIDTH = 60;

function SortIcon({ direction }) {
  if (direction === 'asc') return <ChevronUp size={13} />;
  if (direction === 'desc') return <ChevronDown size={13} />;
  return <ChevronsUpDown size={13} className="opacity-40" />;
}

export default function Table({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No records found',
  onRowClick,
  sortable = true,
  pagination,
  rowKey = 'id',
  stickyHeader = false,
  compact = false,
  resizable = true,
}) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [colWidths, setColWidths] = useState({});
  const [measured, setMeasured] = useState(false);
  const resizeState = useRef(null);
  const thRefs = useRef({});

  // table-layout:auto only treats an explicit width as a hint — the browser
  // can (and does) override it based on other cells' content, which is why
  // dragging alone has no visible effect. Fixed layout makes widths binding,
  // but applying it before every column has a real width causes the
  // header-overlap bug (unspecified columns get squeezed to equal shares).
  // So: measure each column's natural rendered width once, seed colWidths
  // with it, then switch to fixed layout — nothing moves until the user drags.
  useLayoutEffect(() => {
    if (!resizable || measured || columns.length === 0) return;
    const initial = {};
    columns.forEach((col) => {
      const el = thRefs.current[col.key];
      if (el) initial[col.key] = el.offsetWidth;
    });
    if (Object.keys(initial).length === columns.length) {
      setColWidths((prev) => ({ ...initial, ...prev }));
      setMeasured(true);
    }
  });

  const handleResizeMove = (e) => {
    const st = resizeState.current;
    if (!st) return;
    const next = Math.max(MIN_COL_WIDTH, st.startWidth + (e.clientX - st.startX));
    setColWidths((prev) => ({ ...prev, [st.key]: next }));
  };

  const handleResizeEnd = () => {
    resizeState.current = null;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const handleResizeStart = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    const th = e.currentTarget.closest('th');
    resizeState.current = { key, startX: e.clientX, startWidth: th.offsetWidth };
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleSort = (col) => {
    if (!col.sortable && !sortable) return;
    if (sortCol === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col.key);
      setSortDir('asc');
    }
  };

  const sortedData = sortCol
    ? [...data].sort((a, b) => {
        const aVal = a[sortCol];
        const bVal = b[sortCol];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = typeof aVal === 'string'
          ? aVal.localeCompare(bVal)
          : aVal - bVal;
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : data;

  const cellPad = compact ? 'px-3 py-2' : 'px-7 py-3';

  // Only columns that were actually dragged (or given an explicit col.width)
  // get an inline width — everything else keeps the browser's normal
  // content-based auto sizing, so tables look identical until resized.
  const getColStyle = (col) => {
    const width = colWidths[col.key] ?? col.width;
    if (!width) return undefined;
    return { width: typeof width === 'number' ? `${width}px` : width };
  };

  return (
    <div className="flex flex-col gap-0">
      <div className={`overflow-x-auto rounded-xl border border-gray-100 ${stickyHeader ? 'max-h-[600px]' : ''}`}>
        <table
          className="w-full text-sm border-collapse"
          style={measured ? { tableLayout: 'fixed' } : undefined}
        >
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  ref={(el) => { if (el) thRefs.current[col.key] = el; }}
                  style={getColStyle(col)}
                  className={`
                    ${cellPad} border-r-2 border-r-gray-300 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis
                    ${(sortable || col.sortable) && col.sortable !== false ? 'cursor-pointer hover:text-gray-700 select-none' : ''}
                    ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                    ${resizable ? 'relative' : ''}
                  `}
                  onClick={() => (col.sortable !== false) && handleSort(col)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && sortable && <SortIcon direction={sortCol === col.key ? sortDir : null} />}
                  </span>
                  {resizable && col.resizable !== false && (
                    <span
                      onMouseDown={(e) => handleResizeStart(e, col.key)}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none hover:bg-primary/40 active:bg-primary/60"
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} style={getColStyle(col)} className={cellPad}>
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr
                  key={row[rowKey]}
                  className={`
                    transition-colors
                    ${onRowClick ? 'cursor-pointer hover:bg-red-50/30' : 'hover:bg-gray-50/60'}
                  `}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={getColStyle(col)}
                      className={`
                        ${cellPad} text-gray-700
                        ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}
                        ${col.className || ''}
                      `}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-500">
            Showing {pagination.from}–{pagination.to} of {pagination.total} records
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              disabled={pagination.page <= 1}
              onClick={() => pagination.onChange(pagination.page - 1)}
            />
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - pagination.page) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => pagination.onChange(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                    ${p === pagination.page ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}
                  `}
                >
                  {p}
                </button>
              ))}
            <Button
              variant="outline"
              size="sm"
              icon={ChevronRight}
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onChange(pagination.page + 1)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
