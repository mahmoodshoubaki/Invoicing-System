'use client';

/** The toolbar's small building blocks: an icon button, a labelled table action, a divider. */

import { CHROME, STATUS } from '@/theme/vizPalette';

export function ToolButton({ icon: Icon, label, active = false, disabled = false, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the editor's selection: the click must not move focus first.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-7 w-7 place-items-center rounded-md transition-colors disabled:opacity-35 ${active ? 'bg-[#3c3c3a] text-white' : 'hover:bg-[#f1f0ee]'}`}
      style={active ? undefined : { color: CHROME.textSecondary }}
    >
      <Icon size={14} aria-hidden="true" />
    </button>
  );
}

/** A labelled action for the table bar — table operations are easier to read than to guess from icons. */
export function TableAction({ icon: Icon, label, onClick, disabled = false, danger = false }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] transition-colors hover:bg-[#f1f0ee] disabled:opacity-35"
      style={{ color: danger ? STATUS.critical : CHROME.textSecondary }}
    >
      <Icon size={12} aria-hidden="true" /> {label}
    </button>
  );
}

export const Divider = () => <span className="mx-0.5 h-5 w-px bg-[#e9e7e5]" aria-hidden="true" />;
