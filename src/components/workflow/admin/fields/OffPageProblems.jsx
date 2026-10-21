'use client';

import { AlertTriangle } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/**
 * Problems on rows the table is not showing right now — on another page, or
 * left out by the search. Without this a Save held back by a row out of sight
 * would give no reason. "Show" searches for that row.
 *
 * @param {{ items: Array<{ name: string, label: string, message: string }>, onShow: (name: string) => void }} props
 */
export default function OffPageProblems({ items, onShow }) {
  if (items.length === 0) return null;

  return (
    <div className="mb-3 rounded-lg px-3 py-2" style={{ backgroundColor: withAlpha(STATUS.critical, 0.07) }}>
      <p className="mb-1 text-[11px] font-semibold" style={{ color: STATUS.critical }}>
        Not on this page
      </p>
      {items.map((item) => (
        <p key={item.name} className="flex items-start gap-1.5 text-xs" style={{ color: CHROME.textSecondary }}>
          <AlertTriangle size={12} className="mt-0.5 shrink-0" style={{ color: STATUS.critical }} aria-hidden="true" />
          <span className="min-w-0">
            <button
              type="button"
              onClick={() => onShow(item.name)}
              className="font-medium underline underline-offset-2"
              style={{ color: STATUS.info }}
            >
              {item.label || item.name}
            </button>
            {' — '}
            {item.message}
          </span>
        </p>
      ))}
    </div>
  );
}
