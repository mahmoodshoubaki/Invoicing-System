'use client';

import { useCallback, useRef, useState } from 'react';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { invoiceRepository } from '@/repositories/invoiceRepository';

/**
 * @param {string} projectCode
 * @param {boolean} enabled false when the user cannot view invoices
 */
export function useProjectFinancialClaims(projectCode, enabled) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null });
  const latest = useRef(0);

  const load = useCallback(async () => {
    const call = ++latest.current;
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await invoiceRepository.getProjectFinancialClaims(projectCode);
      if (call === latest.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (call === latest.current) setState({ data: null, loading: false, error });
    }
  }, [projectCode, enabled]);

  useLoadOnChange(load);

  return { ...state, reload: load };
}
