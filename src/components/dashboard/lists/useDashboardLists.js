'use client';

import { useCallback } from 'react';

import { useServerPage } from '@/hooks/useServerPage';
import { dashboardRepository } from '@/repositories/dashboardRepository';

/** Every late invoicing cycle, the most late first, a page at a time. `meta.boqCount` counts their BOQs. */
export function useDelayedCyclesPage(projectStatus) {
  const fetchPage = useCallback(async ({ skip, take }) => {
    const page = await dashboardRepository.getDelayedCycles({ projectStatus: projectStatus || null, skip, take });
    return {
      rows: page.cycles.map((c) => ({ ...c, id: `${c.boqItemId}-${c.cycleNumber}` })),
      total: page.total,
      boqCount: page.boqCount,
    };
  }, [projectStatus]);
  return useServerPage(fetchPage, { key: projectStatus });
}

/** Every past-due workflow task, the most late first, a page at a time. */
export function useSlaViolationsPage(projectStatus) {
  const fetchPage = useCallback(async ({ skip, take }) => {
    const page = await dashboardRepository.getSlaViolations({ projectStatus: projectStatus || null, skip, take });
    return { rows: page.tasks.map((t) => ({ ...t, id: t.taskId })), total: page.total };
  }, [projectStatus]);
  return useServerPage(fetchPage, { key: projectStatus });
}

/** Every open request, newest first, a page at a time. `meta.byType` counts each kind whatever `type` is. */
export function usePendingApprovalsPage(projectStatus, type) {
  const fetchPage = useCallback(async ({ skip, take }) => {
    const page = await dashboardRepository.getPendingApprovals({
      projectStatus: projectStatus || null, type: type || null, skip, take,
    });
    return {
      rows: page.items.map((item) => ({ ...item, key: `${item.type}-${item.id}` })),
      total: page.total,
      byType: page.byType,
    };
  }, [projectStatus, type]);
  return useServerPage(fetchPage, { key: `${projectStatus}|${type}` });
}
