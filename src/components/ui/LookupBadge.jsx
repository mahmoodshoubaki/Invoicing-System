'use client';

import { memo } from 'react';

import { CHROME } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/**
 * A status, priority or channel, in the colour the API gives it.
 *
 * The colour sits behind the text at a low alpha and the dot carries it at
 * full strength — readable whatever hex the backend chose, and quiet enough
 * that a page of them does not shout.
 *
 * @param {{ label: string, colorHex?: string|null, title?: string, size?: 'xs'|'sm' }} props
 */
function LookupBadge({ label, colorHex, title, size = 'xs' }) {
  const tone = colorHex || CHROME.textMuted;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-1.5 py-0.5 text-[11px]'
      }`}
      style={{ backgroundColor: withAlpha(tone, 0.12, '#f1f0ee'), color: CHROME.textPrimary }}
      title={title}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: tone }} aria-hidden="true" />
      {label}
    </span>
  );
}

export default memo(LookupBadge);
