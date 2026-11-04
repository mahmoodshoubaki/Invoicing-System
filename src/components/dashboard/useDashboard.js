'use client';

import { useCallback, useState } from 'react';

import { clampPeriod, lastMonthOf, yearOptions } from '@/lib/dashboardPeriod';
import { dashboardRepository } from '@/repositories/dashboardRepository';
import { useDashboardQuery } from './useDashboardQuery';
import { useProjectStatuses } from './useProjectStatuses';

const LIST_SHOWN = 5;
export const TREND_MONTHS = 12;

/** The dashboard's filters: a month (this one by default, never later) and an optional project status. */
export function useDashboardFilters() {
  const now = new Date();
  const [period, setPeriodState] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [projectStatus, setProjectStatus] = useState('');
  const statuses = useProjectStatuses();

  const setPeriod = useCallback((next) => setPeriodState(clampPeriod(next)), []);
  const periodLabel = new Date(period.year, period.month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  return {
    ...period,
    setPeriod,
    years: yearOptions(now),
    lastMonth: lastMonthOf(period.year, now),
    projectStatus,
    setProjectStatus,
    statuses,
    periodLabel,
  };
}

/**
 * The dashboard sources, loaded side by side. Each has its own status, so one
 * can load or fail without the others.
 */
export function useDashboard({ month, year, projectStatus }) {
  const status = projectStatus || null;
  const fetchFinancial = useCallback(
    () => dashboardRepository.getFinancialSummary({ month, year, projectStatus: status }),
    [month, year, status]
  );
  const fetchInvoices = useCallback(
    () => dashboardRepository.getInvoiceSummary({ latest: 0, projectStatus: status }),
    [status]
  );
  const fetchPending = useCallback(
    () => dashboardRepository.getPendingApprovals({ projectStatus: status, take: LIST_SHOWN }),
    [status]
  );
  const fetchTrend = useCallback(
    () => dashboardRepository.getMonthlyTrend({ months: TREND_MONTHS, month, year, projectStatus: status }),
    [month, year, status]
  );
  const fetchDelayed = useCallback(
    () => dashboardRepository.getDelayedCycles({ projectStatus: status, take: LIST_SHOWN }),
    [status]
  );
  const fetchSla = useCallback(
    () => dashboardRepository.getSlaViolations({ projectStatus: status, take: LIST_SHOWN }),
    [status]
  );
  const periodKey = `${year}-${month}|${status ?? ''}`;
  return {
    financial: useDashboardQuery(fetchFinancial, periodKey),
    invoices: useDashboardQuery(fetchInvoices, status ?? ''),
    pending: useDashboardQuery(fetchPending, status ?? ''),
    trend: useDashboardQuery(fetchTrend, periodKey),
    delayed: useDashboardQuery(fetchDelayed, status ?? ''),
    sla: useDashboardQuery(fetchSla, status ?? ''),
  };
}
