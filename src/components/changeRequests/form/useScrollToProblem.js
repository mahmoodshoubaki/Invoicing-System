'use client';

import { useEffect } from 'react';

/**
 * After a refused Submit (2026-10-20): scroll to the first problem inside
 * `rootRef` and put the cursor in its box. `refusedCount` ticks on each
 * refusal; the effect runs after the render that opened any folded item with
 * a problem.
 *
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
