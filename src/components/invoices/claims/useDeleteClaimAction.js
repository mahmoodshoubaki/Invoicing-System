'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { invoiceRepository } from '@/repositories/invoiceRepository';
import { claimDeleteError } from '@/lib/claimActionForm';

/**
 * @param {(result: { warning?: string }) => void} onDone
 */
export function useDeleteClaimAction(onDone) {
  const [entry, setEntry] = useState(null);
  const t = useTranslations('claims.errors');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const ask = useCallback((row) => {
    setError(null);
    setEntry(row);
  }, []);

  const cancel = () => {
    if (!deleting) setEntry(null);
  };

  const confirm = async () => {
    if (!entry) return;
    setDeleting(true);
    setError(null);
    try {
      await invoiceRepository.deleteNonEtimadClaimAction(entry.id);
      setEntry(null);
      onDone({});
    } catch (err) {
      const found = claimDeleteError(err, t);
      if (found.reload) {
        setEntry(null);
        onDone({ warning: found.message });
      } else {
        setError(found.message);
      }
    } finally {
      setDeleting(false);
    }
  };

  return { entry, deleting, error, ask, cancel, confirm };
}
