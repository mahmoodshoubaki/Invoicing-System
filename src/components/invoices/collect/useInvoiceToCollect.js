'use client';

import { useCallback, useRef, useState } from 'react';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { invoiceRepository } from '@/repositories/invoiceRepository';

/**
 * @param {string} invoiceId
 */
export function useInvoiceToCollect(invoiceId) {
  const [state, setState] = useState({ invoice: null, loading: true, error: null });
  const latest = useRef(0);

  const load = useCallback(async () => {
    const call = ++latest.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const invoice = await invoiceRepository.getInvoiceById(invoiceId);
      if (call === latest.current) setState({ invoice, loading: false, error: null });
    } catch (error) {
      if (call === latest.current) setState({ invoice: null, loading: false, error });
    }
  }, [invoiceId]);

  useLoadOnChange(load);

  return { ...state, reload: load };
}
