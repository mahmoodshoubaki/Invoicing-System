'use client';

import { useEffect } from 'react';

/**
 * @param {{ current: HTMLElement|null }} rootRef
 * @param {number} refusedCount
 */
export function useScrollToProblem(rootRef, refusedCount) {
  useEffect(() => {
    if (!refusedCount) return undefined;
    // A timer, not an animation frame: a frame never comes in a background tab.
    const timer = setTimeout(() => {
      const first = rootRef.current?.querySelector('[data-problem]');
      if (!first) return;
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const box = first.closest('[data-field]')?.querySelector('input:not([readonly]), select, textarea, [role="button"]')
        ?? first.closest('[data-problem-scope]')?.querySelector('input, select, textarea, [role="button"]');
      box?.focus({ preventScroll: true });
    }, 0);
    return () => clearTimeout(timer);
  }, [rootRef, refusedCount]);
}
