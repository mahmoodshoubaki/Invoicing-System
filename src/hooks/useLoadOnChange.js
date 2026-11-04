'use client';

import { useEffect } from 'react';

/**
 * @param {() => unknown} load
 */
export function useLoadOnChange(load) {
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) load();
    });
    return () => { cancelled = true; };
  }, [load]);
}
