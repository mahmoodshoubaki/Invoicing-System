'use client';

import { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';
import { PAGE_SIZE_OPTIONS } from '@/lib/pageInfo';
import { formatNumber } from '@/utils/formatters';

/**
 * The paged tables' footer: "Showing 11–20 of 34 records", the arrows, and the
 * page numbers around the current one. Table draws it from its `pagination`
 * prop; a page that lays its rows out itself draws the same one under them.
 *
 * A list paged by the server can also let the reader choose how many rows a
 * page holds (2026-10-21) — given `onPageSizeChange`, the sizes are offered
 * beside the count. `busy` holds the controls while a page loads.
 *
 * @param {{
 *   page: number, totalPages: number, total: number, from: number, to: number, onChange: (page: number) => void,
 *   pageSize?: number, onPageSizeChange?: ((size: number) => void)|null, busy?: boolean,
 * }} props
 */
function TablePagination({ page, totalPages, total, from, to, onChange, pageSize, onPageSizeChange = null, busy = false }) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p className="text-xs text-gray-500">
          Showing {formatNumber(from)}–{formatNumber(to)} of {formatNumber(total)} records
        </p>
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            Rows per page
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={busy}
              className="rounded-md border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-700 outline-none focus:border-primary disabled:opacity-50"
            >
              {/* A list that starts at another size (notifications: 20) keeps it among the choices. */}
              {[...new Set([...PAGE_SIZE_OPTIONS, pageSize])].sort((a, b) => a - b).map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            icon={ChevronLeft}
            disabled={page <= 1 || busy}
            onClick={() => onChange(page - 1)}
            aria-label="Previous page"
          />
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2)
            .map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                disabled={busy && p !== page}
                aria-current={p === page ? 'page' : undefined}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors disabled:opacity-50
                  ${p === page ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                {p}
              </button>
            ))}
          <Button
            variant="outline"
            size="sm"
            icon={ChevronRight}
            disabled={page >= totalPages || busy}
            onClick={() => onChange(page + 1)}
            aria-label="Next page"
          />
        </div>
      )}
    </div>
  );
}

export default memo(TablePagination);
