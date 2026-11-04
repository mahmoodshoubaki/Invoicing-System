'use client';

import { useEffect, useRef } from 'react';

/**
 * @param {() => void} callback
 * @param {number} intervalMs
 * @param {boolean} [enabled]
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
