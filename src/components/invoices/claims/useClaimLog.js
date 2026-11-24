'use client';

import { useCallback, useRef, useState } from 'react';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { invoiceRepository } from '@/repositories/invoiceRepository';

/**
 * @param {string} invoiceId
 */
export function useClaimLog(invoiceId) {
  const [state, setState] = useState({ entries: [], loading: true, error: null });
  const latest = useRef(0);

  const load = useCallback(async () => {
    const call = ++latest.current;
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const entries = await invoiceRepository.getNonEtimadClaimActions(invoiceId);
      if (call === latest.current) setState({ entries, loading: false, error: null });
    } catch (error) {
      if (call === latest.current) setState((prev) => ({ ...prev, loading: false, error }));
    }
  }, [invoiceId]);

  useLoadOnChange(load);

  return { ...state, reload: load };
}
