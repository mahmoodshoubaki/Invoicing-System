'use client';

import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClaimStages, selectClaimStages, selectClaimStagesStatus } from '@/store/slices/lookupsSlice';

export function useClaimStages() {
  const dispatch = useDispatch();
  const stages = useSelector(selectClaimStages);
  const status = useSelector(selectClaimStagesStatus);
  const load = useCallback(() => dispatch(fetchClaimStages()), [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  return { stages, status, retry: load };
}
