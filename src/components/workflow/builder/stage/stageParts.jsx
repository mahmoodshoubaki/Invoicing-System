'use client';

/** Small pieces the stage's panel sections share. */

import { CHROME, STATUS } from '@/theme/vizPalette';

/** Ends the run — the option every stage needs and no stage list contains. */
export const END_RUN = '__end__';

export function IconButton({ icon: Icon, label, onClick, disabled, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="rounded-md p-1.5 transition-colors hover:bg-[#f1f0ee] disabled:cursor-not-allowed disabled:opacity-30"
      style={{ color: danger ? STATUS.critical : CHROME.textMuted }}
    >
      <Icon size={14} aria-hidden="true" />
    </button>
  );
}
