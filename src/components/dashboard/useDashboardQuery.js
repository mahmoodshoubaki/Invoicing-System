'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * @param {() => Promise<any>} fetcher
 * @param {string} key
 * @returns {{ status: 'loading'|'ready'|'error'|'forbidden', data: any, error: Error|null, reload: () => void }}
 */
export function useDashboardQuery(fetcher, key) {
  const [reloads, setReloads] = useState(0);
  const [state, setState] = useState({ sig: null, status: 'loading', data: null, error: null });
  const sig = `${key}|${reloads}`;

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => { if (!cancelled) setState({ sig, status: 'ready', data, error: null }); })
      .catch((error) => {
        if (!cancelled) setState({ sig, status: error?.status === 403 ? 'forbidden' : 'error', data: null, error });
      });
    return () => { cancelled = true; };
  }, [fetcher, sig]);

  const reload = useCallback(() => setReloads((n) => n + 1), []);
  return state.sig === sig ? { ...state, reload } : { status: 'loading', data: null, error: null, reload };
}
