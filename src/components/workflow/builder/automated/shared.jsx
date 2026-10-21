'use client';

/** Pieces every part of the Call API editor uses: the field look, its labels, and how inputs are split. */

import { CHROME } from '@/theme/vizPalette';

export const controlClass =
  'rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary';

export function Label({ children, hint }) {
  return (
    <p className="mb-1 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
      {children}
      {hint && <span className="ml-1 font-normal" style={{ color: CHROME.textMuted }}>{hint}</span>}
    </p>
  );
}

/**
 * `header.<Name>` inputs are headers; everything else is an ordinary input.
 *
 * Headers never appear in an action's declared `inputs` because the author
 * invents their names, so they are the one part of an `http.call` that stays a
 * free-text editor however well the catalog describes the rest.
 */
export const HEADER_PREFIX = 'header.';

export function splitInputs(inputs = {}) {
  const headers = [];
  const rest = {};
  for (const [key, value] of Object.entries(inputs)) {
    if (key.startsWith(HEADER_PREFIX)) headers.push([key.slice(HEADER_PREFIX.length), value]);
    else rest[key] = value;
  }
  return { headers, rest };
}
