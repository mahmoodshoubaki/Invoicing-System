'use client';

import { useState } from 'react';
import { Search, Undo2 } from 'lucide-react';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import { valueProblem } from '@/lib/runVariables';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import RunVariableInput from './RunVariableInput';

/** With more values than this, a search box narrows them. */
const SEARCH_FROM = 8;

/** "was 10", "was empty" — what a changed value held. */
const was = (text) => (text === '' ? 'was empty' : `was ${text.length > 60 ? `${text.slice(0, 60)}…` : text}`);

/**
 * A run's values, each changeable before it is resumed (2026-10-21) — one row
 * per value, a variable holding fields as a heading with its fields under it.
 * A changed row says what it was and can be put back; one that would be
 * refused says why, and the server's own complaint replaces that once sent.
 *
 * @param {{
 *   vars: ReturnType<import('./useRunVariables').useRunVariables>,
 *   edits: Object<string, string>, onEdit: (name: string, text: string) => void, onUndo: (name: string) => void,
 *   serverErrors: Object<string, string>, disabled?: boolean,
 * }} props
 */
export default function RunVariablesEditor({ vars, edits, onEdit, onUndo, serverErrors, disabled = false }) {
  const [query, setQuery] = useState('');

  if (vars.status === 'loading') return <div className="flex justify-center py-3"><LoadingSpinner /></div>;
  if (vars.status === 'error') {
    return (
      <p className="text-[11px]" style={{ color: STATUS.critical }}>
        Its values could not be loaded{vars.error?.message ? ` — ${vars.error.message}` : ''}. It can still be resumed as it is.
      </p>
    );
  }
  if (vars.rows.length === 0) {
    return <p className="text-[11px]" style={{ color: CHROME.textMuted }}>This run holds no values.</p>;
  }

  const needle = query.trim().toLowerCase();
  const shown = needle
    ? vars.rows.filter((r) => r.name.toLowerCase().includes(needle) || (r.parent ?? '').toLowerCase().includes(needle))
    : vars.rows;

  return (
    <div>
      {vars.rows.length > SEARCH_FROM && (
        <label className="mb-2 flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1">
          <Search size={12} style={{ color: CHROME.textMuted }} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a value…"
            aria-label="Find a value"
            className="min-w-0 flex-1 text-xs outline-none"
          />
        </label>
      )}

      <ul className="flex max-h-80 flex-col overflow-y-auto rounded-lg border border-[#eceae4]">
        {shown.map((row) => {
          if (row.group) {
            return (
              <li key={row.name} className="border-b border-[#f1f0ee] bg-[#f6f5f3] px-3 py-1.5 text-[11px] last:border-0" style={{ color: CHROME.textSecondary }}>
                <span className="font-mono font-semibold">{row.name}</span>
                <span style={{ color: CHROME.textMuted }}> — its fields</span>
              </li>
            );
          }
          const text = row.name in edits ? edits[row.name] : row.text;
          const changed = text !== row.text;
          const problem = serverErrors[row.name] ?? (changed ? valueProblem(row, text) : null);
          return (
            <li
              key={row.name}
              className="grid grid-cols-1 gap-1.5 border-b border-[#f1f0ee] px-3 py-2 last:border-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:items-start"
              style={changed ? { backgroundColor: withAlpha(STATUS.info, 0.05) } : undefined}
            >
              <div className={`min-w-0 ${row.parent ? 'pl-3' : ''}`}>
                <p className="truncate font-mono text-[11px]" style={{ color: CHROME.textPrimary }} title={row.name}>
                  {row.parent ? row.name.slice(row.parent.length + 1) : row.name}
                </p>
                <p className="text-[10px]" style={{ color: CHROME.textMuted }}>{row.type ?? 'text'}</p>
              </div>
              <div className="min-w-0">
                {row.editable ? (
                  <RunVariableInput
                    row={row}
                    text={text}
                    onChange={(next) => onEdit(row.name, next)}
                    people={vars.people}
                    invalid={Boolean(problem)}
                    disabled={disabled}
                  />
                ) : (
                  <p className="truncate font-mono text-[11px]" style={{ color: CHROME.textMuted }} title={row.text}>
                    {row.text || '—'} <span className="font-sans">· holds fields of its own, so it can&rsquo;t be changed here</span>
                  </p>
                )}
                {changed && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10px]" style={{ color: CHROME.textMuted }}>
                    <span className="min-w-0 truncate">{was(row.text)}</span>
                    <button
                      type="button"
                      onClick={() => onUndo(row.name)}
                      className="inline-flex shrink-0 items-center gap-0.5 underline-offset-2 hover:underline"
                      style={{ color: STATUS.info }}
                    >
                      <Undo2 size={10} aria-hidden="true" /> Put back
                    </button>
                  </p>
                )}
                {problem && <p className="mt-0.5 text-[11px]" style={{ color: STATUS.critical }}>{problem}</p>}
              </div>
            </li>
          );
        })}
        {shown.length === 0 && (
          <li className="px-3 py-3 text-center text-[11px]" style={{ color: CHROME.textMuted }}>No value matches.</li>
        )}
      </ul>
    </div>
  );
}
