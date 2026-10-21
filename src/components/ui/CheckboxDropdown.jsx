'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/**
 * A dropdown of checkboxes (2026-10-20): the closed box shows what is picked,
 * as small tags that can be taken off; opened, it lists every option — each
 * with an optional line under it — to tick or untick. It closes on a click
 * outside or Escape.
 *
 * `compact` (2026-10-20) is for narrow places like the workflow builder's side
 * panel: a smaller box whose closed face is one line — "Finance, Admin +3 more",
 * the whole list on hover — so a long selection never wraps onto several lines.
 *
 * @param {{
 *   options: Array<{ value: string|number, label: string, description?: string }>,
 *   selected: Array<string|number>, onToggle: (value) => void,
 *   placeholder?: string, error?: string|null, label?: string, compact?: boolean,
 * }} props
 */
export default function CheckboxDropdown({ options, selected, onToggle, placeholder = 'Choose…', error = null, label, compact = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const outside = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    const escape = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const picked = options.filter((o) => selected.includes(o.value));
  const summary = picked.length > 2
    ? `${picked.slice(0, 2).map((o) => o.label).join(', ')} +${picked.length - 2} more`
    : picked.map((o) => o.label).join(', ');

  return (
    <div ref={rootRef} className="relative">
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        title={compact && picked.length ? picked.map((o) => o.label).join(', ') : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); } }}
        className={`flex w-full cursor-pointer items-center gap-2 rounded-lg border bg-white transition-colors ${
          compact ? 'min-h-[32px] px-2 py-1 text-xs' : 'min-h-[42px] px-3 py-1.5 text-sm'
        } ${
          error ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {compact ? (
          <span className={`min-w-0 flex-1 truncate ${picked.length ? '' : 'text-gray-400'}`} style={picked.length ? { color: CHROME.textPrimary } : undefined}>
            {picked.length ? summary : placeholder}
          </span>
        ) : (
          <span className="flex min-w-0 flex-1 flex-wrap gap-1">
            {picked.length === 0 ? (
              <span className="py-1 text-gray-400">{placeholder}</span>
            ) : picked.map((o) => (
              <span
                key={o.value}
                className="inline-flex items-center gap-1 rounded-full py-0.5 pl-2 pr-1 text-xs"
                style={{ backgroundColor: withAlpha(STATUS.info, 0.1), color: CHROME.textPrimary }}
              >
                {o.label}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggle(o.value); }}
                  className="rounded-full p-0.5 hover:bg-white/70"
                  aria-label={`Remove ${o.label}`}
                  style={{ color: CHROME.textMuted }}
                >
                  <X size={10} aria-hidden="true" />
                </button>
              </span>
            ))}
          </span>
        )}
        <ChevronDown size={15} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: CHROME.textMuted }} aria-hidden="true" />
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
        >
          {options.map((o) => {
            const checked = selected.includes(o.value);
            return (
              <li key={o.value} role="option" aria-selected={checked}>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-[#f6f5f3]">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-primary" checked={checked} onChange={() => onToggle(o.value)} />
                  <span className="min-w-0">
                    <span className={`block font-medium ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: CHROME.textPrimary }}>{o.label}</span>
                    {o.description && (
                      <span className="mt-0.5 block text-[11px] leading-snug" style={{ color: CHROME.textMuted }}>{o.description}</span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
