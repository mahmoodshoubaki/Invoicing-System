'use client';

import { useCallback } from 'react';

import { useServerPage } from '@/hooks/useServerPage';
import { invoiceRepository } from '@/repositories/invoiceRepository';

/**
 * Every invoice the user can see, newest first, a page at a time.
 *
 * @param {number|null} statusId  null for every status
 */
export function useAllInvoices(statusId) {
  const fetchPage = useCallback(async ({ skip, take }) => {
    const { invoices, total } = await invoiceRepository.getInvoicesPage({ statusId, skip, take });
    return { rows: invoices, total };
  }, [statusId]);
  return useServerPage(fetchPage, { key: String(statusId ?? 'all') });
}
