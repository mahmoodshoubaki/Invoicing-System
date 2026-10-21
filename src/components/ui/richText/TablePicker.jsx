'use client';

/** Choosing a new table's size, and whether its first row is a header. */

import { useState } from 'react';

import { CHROME } from '@/theme/vizPalette';

const PICKER_ROWS = 8;

const PICKER_COLS = 8;

/** Choose a table's size by pointing at a grid, and whether its first row is a header. */
export function TablePicker({ onPick }) {
  const [size, setSize] = useState({ rows: 0, cols: 0 });
  const [header, setHeader] = useState(true);
  return (
    <div className="absolute left-0 top-full z-20 mt-1 rounded-xl border border-[#e9e7e5] bg-white p-2.5 shadow-[0_12px_28px_-12px_rgb(60_60_58/0.35)]">
      <p className="mb-1.5 text-[11px] tabular-nums" style={{ color: CHROME.textSecondary }}>
        {size.rows ? `${size.rows} rows × ${size.cols} columns` : 'Point at a size'}
      </p>
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${PICKER_COLS}, 1rem)` }}
        onMouseLeave={() => setSize({ rows: 0, cols: 0 })}
      >
        {Array.from({ length: PICKER_ROWS * PICKER_COLS }, (_, i) => {
          const rows = Math.floor(i / PICKER_COLS) + 1;
          const cols = (i % PICKER_COLS) + 1;
          const on = rows <= size.rows && cols <= size.cols;
          return (
            <button
              key={i}
              type="button"
              aria-label={`${rows} rows by ${cols} columns`}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setSize({ rows, cols })}
              onFocus={() => setSize({ rows, cols })}
              onClick={() => onPick(rows, cols, header)}
              className="h-4 w-4 rounded-[3px] border"
              style={{ borderColor: on ? '#f8485e' : '#e1e0d9', backgroundColor: on ? 'rgb(248 72 94 / 0.15)' : '#fff' }}
            />
          );
        })}
      </div>
      <label className="mt-2 flex items-center gap-1.5 text-[11px]" style={{ color: CHROME.textSecondary }}>
        <input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} />
        First row is a header
      </label>
    </div>
  );
}
