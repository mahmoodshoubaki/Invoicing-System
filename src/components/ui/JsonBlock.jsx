'use client';

import { memo, useMemo } from 'react';

import { CHROME } from '@/theme/vizPalette';

/**
 * A JSON string shown as indented JSON — or as it came, if it does not parse.
 *
 * @param {{ value: string|null, maxHeight?: number }} props
 */
function JsonBlock({ value, maxHeight = 260 }) {
  const text = useMemo(() => {
    if (!value) return '';
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return String(value);
    }
  }, [value]);

  if (!text) return <p className="text-[11px]" style={{ color: CHROME.textMuted }}>Nothing recorded.</p>;

  return (
    <pre
      className="overflow-auto rounded-lg p-3 font-mono text-[11px] leading-relaxed"
      style={{ maxHeight, backgroundColor: '#f6f5f3', color: CHROME.textSecondary }}
    >
      {text}
    </pre>
  );
}

export default memo(JsonBlock);
