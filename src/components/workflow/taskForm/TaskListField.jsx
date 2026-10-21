'use client';

import { memo, useMemo } from 'react';

import { labelClass } from '@/components/ui/kit';
import { CHROME } from '@/theme/vizPalette';

/** A column's heading from its key: `billedUnitPrice` → "Billed unit price". */
function headingOf(key) {
  const words = String(key).replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** The rows of a list value. Unreadable text is no rows. */
function parseRows(text) {
  if (!text) return [];
  try {
    const raw = JSON.parse(text);
    return Array.isArray(raw) ? raw.filter((r) => r && typeof r === 'object') : [];
  } catch {
    return [];
  }
}

/**
 * A `list` field on a task — an invoice's lines (2026-10-13) — shown, never
 * edited: a task can read a list, as the invoice's Update form does, but never
 * changes it. The task row carries no description of the columns, so they are
 * the rows' own keys.
 *
 * @param {{ field: Object, value: string }} props
 */
function TaskListField({ field, value }) {
  const rows = useMemo(() => parseRows(value), [value]);
  const keys = useMemo(() => [...new Set(rows.flatMap((r) => Object.keys(r)))], [rows]);

  return (
    <div>
      <p className={labelClass} style={{ color: CHROME.textSecondary }}>{field.label || field.name}</p>
      {rows.length === 0 ? (
        <p className="text-xs" style={{ color: CHROME.textMuted }}>None.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {keys.map((k) => (
                  <th key={k} className="whitespace-nowrap px-3 py-2 text-left font-semibold uppercase tracking-wide text-gray-500">
                    {headingOf(k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {rows.map((row, i) => (
                <tr key={row.id ?? i}>
                  {keys.map((k) => (
                    <td key={k} className="px-3 py-2 text-gray-700">{row[k] == null || row[k] === '' ? '—' : String(row[k])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default memo(TaskListField);
