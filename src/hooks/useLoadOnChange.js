'use client';

import { useEffect } from 'react';

/**
 * Runs `load` on mount and whenever it changes (i.e. whenever what it would
 * fetch changes) — the "fetch for this page" effect every screen needs.
 *
 * The call is deferred to a microtask rather than made in the effect body.
 * A load sets state (its spinner, then its data), and setting state
 * synchronously inside an effect forces a second render before the first has
 * even painted — the cascade the react-hooks lint rule exists to stop. A
 * microtask later, the same work happens with the first frame already on
 * screen.
 *
 * A cleanup that has run (Strict Mode's double mount, or the page leaving
 * before the microtask) cancels the call, so a load never lands on a screen
 * that has gone.
 *
 * @param {() => unknown} load a stable callback (useCallback) that loads
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
