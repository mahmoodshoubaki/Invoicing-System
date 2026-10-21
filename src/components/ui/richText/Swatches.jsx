'use client';

/** A colour menu: swatches, none, and a custom colour. */

import { CHROME } from '@/theme/vizPalette';

import { toHex } from './palettes';

/** A row of colour swatches, with "none" and a custom colour. */
export function Swatches({ colors, current: raw, onPick, onClear, clearLabel }) {
  const current = toHex(raw);
  return (
    <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-xl border border-[#e9e7e5] bg-white p-2 shadow-[0_12px_28px_-12px_rgb(60_60_58/0.35)]">
      <div className="grid grid-cols-5 gap-1.5">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(c)}
            aria-label={`Colour ${c}`}
            title={c}
            className="h-7 w-full rounded-md border"
            style={{ backgroundColor: c, borderColor: current === c ? CHROME.textPrimary : '#e9e7e5', outline: current === c ? `2px solid ${CHROME.textPrimary}` : 'none', outlineOffset: 1 }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClear} className="rounded-md px-1.5 py-1 text-[11px] hover:bg-[#f1f0ee]" style={{ color: CHROME.textSecondary }}>
          {clearLabel}
        </button>
        <label className="flex cursor-pointer items-center gap-1.5 text-[11px]" style={{ color: CHROME.textSecondary }}>
          Custom
          {/* Fires while dragging: keeps the menu (and the native picker) open. */}
          <input type="color" value={current ?? '#3c3c3a'} onChange={(e) => onPick(e.target.value, true)} className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0" />
        </label>
      </div>
    </div>
  );
}
