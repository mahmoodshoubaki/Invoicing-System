'use client';

import { useEffect, useRef, useState } from 'react';
import { boqRepository } from '@/repositories/boqRepository';

/**
 * Debounced wrapper around boqRepository.previewInvoicingPlan. Automatically
 * re-fetches whenever anchorDate/billingFrequencyId/contractStartDate/
 * contractFinishDate change, replacing the cycle list wholesale.
 *
 * Used by the Add BOQ Item page only — `anchorDate` there is always the
 * Baseline Invoicing Date, which can only be set at creation. The Edit page
 * has its own preview logic (see boq/[itemId]/edit/page.jsx) since it needs
 * to seed from the item's existing plan first and only preview once the
 * user actually changes something, which this always-on hook doesn't do.
 *
 * @param {object} params
 * @param {string} params.anchorDate
 * @param {number|string} params.billingFrequencyId
 * @param {string} params.contractStartDate
 * @param {string} params.contractFinishDate
 * @param {number} [delayMs]
 * @returns {{ cycles: Array, setCycles: Function, loading: boolean, error: string|null, ready: boolean }}
 */
export function useInvoicingPlanPreview(
  { anchorDate, billingFrequencyId, contractStartDate, contractFinishDate },
  delayMs = 500
) {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const ready = Boolean(anchorDate && billingFrequencyId && contractStartDate && contractFinishDate);

  useEffect(() => {
    if (!ready) {
      setCycles([]);
      setError(null);
      setLoading(false);
      return;
    }

    const thisRequest = ++requestId.current;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const result = await boqRepository.previewInvoicingPlan({
          anchorDate, billingFrequencyId, contractStartDate, contractFinishDate,
        });
        if (requestId.current === thisRequest) {
          setCycles(result);
          setLoading(false);
        }
      } catch (err) {
        if (requestId.current === thisRequest) {
          setError(err.message || 'Failed to generate the invoicing plan.');
          setLoading(false);
        }
      }
    }, delayMs);

    return () => clearTimeout(timer);
  // ready is derived from the other deps — spelling it out again would just be noise.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorDate, billingFrequencyId, contractStartDate, contractFinishDate]);

  return { cycles, setCycles, loading, error, ready };
}
