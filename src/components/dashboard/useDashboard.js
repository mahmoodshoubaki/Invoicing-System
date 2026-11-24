'use client';

import { useCallback, useState } from 'react';
import { useLocale } from 'next-intl';

import { clampPeriod, lastMonthOf, previousMonth, yearOptions } from '@/lib/dashboardPeriod';
import { dashboardRepository } from '@/repositories/dashboardRepository';
import { useDashboardQuery } from './useDashboardQuery';
import { useProjectStatuses } from './useProjectStatuses';

const LIST_SHOWN = 5;
export const TREND_MONTHS = 12;

export function useDashboardFilters() {
  const locale = useLocale();
  const now = new Date();
  const [period, setPeriodState] = useState(() => previousMonth());
  const [projectStatus, setProjectStatus] = useState('');
  const statuses = useProjectStatuses();

  const setPeriod = useCallback((next) => setPeriodState(clampPeriod(next)), []);
  const periodLabel = new Date(period.year, period.month - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
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
