'use client';

import { AlertTriangle, Plus, Trash2, Wand2 } from 'lucide-react';

import { controlClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { BUILT_IN_PLACEHOLDERS } from '@/lib/templatePlaceholders';

/**
 * The values a version's text uses. The server refuses a save whose text uses
 * a value this list does not name (NTF-008), so names the text uses but the
 * list lacks are pointed out, with one click to add them.
 *
 * @param {{
 *   placeholders: Array<{ key: string, value: string }>,
 *   unlisted: string[],
 *   readOnly: boolean,
 *   onChange: (placeholders) => void,
 * }} props
 */
export default function PlaceholdersTab({ placeholders, unlisted, readOnly, onChange }) {
  const edit = (i, patch) => onChange(placeholders.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const addUnlisted = () => onChange([...placeholders, ...unlisted.map((key) => ({ key, value: '' }))]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>
        Every value the text uses must be listed here, each with a default for when the sender gives none —
        otherwise the save is refused. Always available without listing:{' '}
        {BUILT_IN_PLACEHOLDERS.map((b, i) => (
          <span key={b}><code className="font-mono">{`{{ ${b} }}`}</code>{i < BUILT_IN_PLACEHOLDERS.length - 1 ? ', ' : ''}</span>
        ))}.
      </p>

      {unlisted.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px]" style={{ backgroundColor: withAlpha(STATUS.warning, 0.12), color: CHROME.textSecondary }}>
          <AlertTriangle size={11} style={{ color: STATUS.warning }} aria-hidden="true" />
          The text uses {unlisted.map((n) => <code key={n} className="font-mono">{n}</code>)} but the list does not name {unlisted.length === 1 ? 'it' : 'them'} — the save would be refused.
          {!readOnly && (
            <button type="button" onClick={addUnlisted} className="inline-flex items-center gap-1 rounded px-1.5 font-medium underline-offset-2 hover:underline" style={{ color: STATUS.info }}>
              <Wand2 size={11} aria-hidden="true" /> Add {unlisted.length === 1 ? 'it' : 'them'}
            </button>
          )}
        </p>
      )}

      <div className="rounded-lg border border-[#f1f0ee] p-3">
        {placeholders.length === 0 ? (
          <p className="py-2 text-center text-[11px]" style={{ color: CHROME.textMuted }}>None listed yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            <li className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: CHROME.textMuted }}>
              <span className="w-48">Name</span>
              <span className="flex-1">Default</span>
            </li>
            {placeholders.map((p, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <input
                  value={p.key}
                  onChange={(e) => edit(i, { key: e.target.value.replace(/\s+/g, '') })}
                  disabled={readOnly}
                  placeholder="InvoiceNumber"
                  aria-label="Value name"
                  className={`${controlClass} w-48 font-mono`}
                  style={!p.key.trim() ? { borderColor: STATUS.critical } : undefined}
                />
                <input
                  value={p.value}
                  onChange={(e) => edit(i, { value: e.target.value })}
                  disabled={readOnly}
                  placeholder="Default (optional)"
                  aria-label="Default value"
                  className={`${controlClass} min-w-0 flex-1`}
                />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => onChange(placeholders.filter((_, j) => j !== i))}
                    aria-label={`Remove ${p.key || 'this value'}`}
                    className="rounded-md p-1 transition-colors hover:bg-[#f1f0ee]"
                    style={{ color: CHROME.textMuted }}
                  >
                    <Trash2 size={12} aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={() => onChange([...placeholders, { key: '', value: '' }])}
            className="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee]"
            style={{ color: CHROME.textSecondary }}
          >
            <Plus size={11} aria-hidden="true" /> Add a value
          </button>
        )}
      </div>
    </div>
  );
}
