'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

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
}) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

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

  const cellPad = compact ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className="flex flex-col gap-0">
      <div className={`overflow-x-auto rounded-xl border border-gray-100 ${stickyHeader ? 'max-h-[600px]' : ''}`}>
        <table className="w-full text-sm border-collapse">
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    ${cellPad} text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap
                    ${(sortable || col.sortable) && col.sortable !== false ? 'cursor-pointer hover:text-gray-700 select-none' : ''}
                    ${col.width ? `w-[${col.width}]` : ''}
                    ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                  `}
                  onClick={() => (col.sortable !== false) && handleSort(col)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && sortable && <SortIcon direction={sortCol === col.key ? sortDir : null} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className={cellPad}>
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
