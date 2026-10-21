'use client';

import { useEffect, useRef } from 'react';

/**
 * Runs `callback` on an interval, but only while the tab is actually visible.
 *
 * The workflow engine has no live push — SignalR is parked and not coming — so
 * every screen that needs to notice a run moving has to ask. That makes the
 * behaviour when nobody is looking worth getting right: a background tab left
 * open overnight would otherwise fire hundreds of pointless requests, and come
 * back showing whatever the last tick happened to catch.
 *
 * So the interval is cleared when the tab is hidden and, on becoming visible
 * again, `callback` fires **immediately** before the interval restarts. The
 * data a returning user sees is fetched on their return, not inherited from
 * however long ago they left.
 *
 * `callback` is held in a ref, so an inline arrow function does not restart the
 * timer on every render.
 *
 * **It does NOT fire on mount.** The first call is one interval away, so every
 * caller needs its own initial load — `useEffect(() => { load(); }, [load])`.
 * Leaving that out does not show an empty screen; it shows a confidently wrong
 * one, because a list with nothing in it yet renders as "nothing found" until
 * the first tick lands.
 *
 * @param {() => void} callback
 * @param {number} intervalMs   how often to poll while visible
 * @param {boolean} [enabled]   false stops polling entirely (no permission, etc.)
 */
export function usePolling(callback, intervalMs, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !intervalMs) return undefined;

    let timerId = null;

    const stop = () => {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    const start = () => {
      stop();
      timerId = setInterval(() => savedCallback.current(), intervalMs);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        // Catch up first, then resume the cadence — otherwise a user returning
        // to the tab waits a full interval to see anything current.
        savedCallback.current();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [intervalMs, enabled]);
}

export default usePolling;
