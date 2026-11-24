'use client';

import { useCallback, useRef, useState } from 'react';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { invoiceRepository } from '@/repositories/invoiceRepository';

const NO_HISTORY = [];

/**
 * @param {number|null} reference the claim's reference number; nothing loads while it is null
 */
export function useFinancialClaimHistory(reference) {
  const [state, setState] = useState({ history: NO_HISTORY, loading: reference != null, error: null });
  const latest = useRef(0);

  const load = useCallback(async () => {
    const call = ++latest.current;
    if (reference == null) {
      setState({ history: NO_HISTORY, loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const history = await invoiceRepository.getFinancialClaimHistory(reference);
      if (call === latest.current) setState({ history, loading: false, error: null });
    } catch (error) {
      if (call === latest.current) setState({ history: NO_HISTORY, loading: false, error });
    }
  }, [reference]);

  useLoadOnChange(load);

  return { ...state, reload: load };
}
