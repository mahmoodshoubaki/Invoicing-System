'use client';

import { memo } from 'react';
import { CHROME } from '@/theme/vizPalette';

function InfoRow({ label, value }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: CHROME.textMuted }}
      >
        {label}
      </span>
      <span className="truncate text-sm font-medium" style={{ color: CHROME.textPrimary }}>
        {value || '—'}
      </span>
    </div>
  );
}

export default memo(InfoRow);
