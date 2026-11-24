'use client';

import { useCallback, useRef, useState } from 'react';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { invoiceRepository } from '@/repositories/invoiceRepository';

/**
 * @param {string} invoiceId
 */
export function useInvoiceFinancialClaim(invoiceId) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const latest = useRef(0);

  const load = useCallback(async () => {
    const call = ++latest.current;
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await invoiceRepository.getInvoiceFinancialClaim(invoiceId);
      if (call === latest.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (call === latest.current) setState({ data: null, loading: false, error });
    }
  }, [invoiceId]);

  useLoadOnChange(load);

  return { ...state, reload: load };
}
