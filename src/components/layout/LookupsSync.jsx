'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchBillingFrequencies, fetchBoqItemStatuses, fetchInvoiceStatuses } from '@/store/slices/lookupsSlice';

/**
 * Renderless component — dispatches all lookup fetches once on app mount.
 * Place inside <Provider> in the dashboard layout.
 * Add new fetchX() calls here as new lookup endpoints are wired up.
 */
export default function LookupsSync() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchBillingFrequencies());
  }, [dispatch]);
  useEffect(() => {
    dispatch(fetchBoqItemStatuses());
  }, [dispatch]);
  useEffect(() => {
    dispatch(fetchInvoiceStatuses());
  }, [dispatch]);

  return null;
}
