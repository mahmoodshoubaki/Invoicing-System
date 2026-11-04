'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  fetchBillingFrequencies, fetchBoqItemStatuses, fetchChangeRequestReasons, fetchChangeRequestStatuses,
  fetchChangeRequestTypes, fetchChangeRequestProjectEffects,
  fetchInvoiceStatuses, fetchTrackerCycleStatuses,
} from '@/store/slices/lookupsSlice';

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
  useEffect(() => {
    dispatch(fetchTrackerCycleStatuses());
  }, [dispatch]);
  useEffect(() => {
    dispatch(fetchChangeRequestReasons());
    dispatch(fetchChangeRequestTypes());
    dispatch(fetchChangeRequestProjectEffects());
    dispatch(fetchChangeRequestStatuses());
  }, [dispatch]);

  return null;
}
