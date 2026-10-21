'use client';

import { Braces } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';

/**
 * Inserts a `{{ value }}` — one of the names this text may use — filled in
 * when the notification is sent.
 *
 * `align` says which edge the list hangs from — `right` for a button at the right end of a row.
 *
 * @param {{
 *   open: boolean, onToggle: () => void, names: string[], onInsert: (name: string) => void,
 *   align?: 'left'|'right',
 * }} props
 */
export default function ValueMenu({ open, onToggle, names, onInsert, align = 'left' }) {
  return (
    <span className="relative">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onToggle}
        aria-expanded={open}
        className={`flex h-7 items-center gap-1 rounded-md px-1.5 text-xs transition-colors ${open ? 'bg-[#f1f0ee]' : 'hover:bg-[#f1f0ee]'}`}
        style={{ color: STATUS.info }}
        title="Insert a value, filled in when the notification is sent"
      >
        <Braces size={13} aria-hidden="true" /> Value
      </button>
      {open && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full z-20 mt-1 max-h-64 w-56 overflow-y-auto rounded-xl border border-[#e9e7e5] bg-white p-1 shadow-[0_12px_28px_-12px_rgb(60_60_58/0.35)]`}>
          {names.map((name) => (
            <button
              key={name}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onInsert(name)}
              className="block w-full rounded-md px-2 py-1.5 text-left font-mono text-[11px] hover:bg-[#f6f5f3]"
              style={{ color: CHROME.textPrimary }}
            >
              {`{{ ${name} }}`}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
