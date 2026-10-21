'use client';

import { memo } from 'react';

/**
 * Placeholder rows while the first page loads — the page keeps its shape, so
 * nothing jumps when the data lands, and it reads as "almost there" rather
 * than a spinner's "wait".
 *
 * @param {{ rows?: number, height?: number }} props
 */
function Skeleton({ rows = 5, height = 44 }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg"
          style={{ height, backgroundColor: '#f6f5f3', opacity: 1 - i * (0.6 / rows) }}
        />
      ))}
    </div>
  );
}

export default memo(Skeleton);
