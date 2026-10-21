'use client';

import { memo } from 'react';
import { MoreHorizontal } from 'lucide-react';

import { CHROME } from '@/theme/vizPalette';

/**
 * The ⋯ on a card: the same menu as a right-click, for anybody who would never
 * think to right-click — and for keyboards and touch screens, which cannot.
 *
 * @param {{ label: string, onOpen: (button: HTMLElement) => void }} props
 */
function MenuButton({ label, onOpen }) {
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(e.currentTarget);
      }}
      className="shrink-0 rounded-md p-1 transition-colors hover:bg-[#f1f0ee]"
      style={{ color: CHROME.textMuted }}
    >
      <MoreHorizontal size={15} aria-hidden="true" />
    </button>
  );
}

export default memo(MenuButton);
