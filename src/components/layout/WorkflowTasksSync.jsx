'use client';

import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { fetchPendingCount } from '@/store/slices/workflowTasksSlice';
import { usePermission } from '@/hooks/usePermission';
import { usePolling } from '@/hooks/usePolling';
import { allow, WORKFLOW_TASK_PERMISSIONS } from '@/constants/workflowPermissions';

/**
 * Renderless — keeps the sidebar's task badge current.
 *
 * Asks for the COUNT only — one row, read for `pendingCount` — and never loads
 * the list. It used to download the whole list every two minutes on every page
 * of the app just to count it; and once the list became paged, writing into it
 * from here would have yanked the My Tasks screen back to page 1 mid-read.
 *
 * Deliberately slower than the My Tasks screen's own poll: this one exists so a
 * user working elsewhere notices that something has landed, which a minute of
 * lag does not hurt. Every page the screen loads also carries `pendingCount`,
 * so with the screen open the badge is kept fresher still, for free.
 *
 * Gated on the permission because an unauthorised GetMyTasks returns 403, and a
 * background poll that 403s every minute is noise with no user to explain it to.
 *
 * Must be mounted inside <AuthProvider> — it reads capabilities.
 */
export default function WorkflowTasksSync() {
  const dispatch = useDispatch();
  const { can } = usePermission();

  const canView = allow(can, WORKFLOW_TASK_PERMISSIONS.VIEW);

  // One row, read for its count — never the list. See fetchPendingCount.
  const load = useCallback(() => {
    dispatch(fetchPendingCount());
  }, [dispatch]);

  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  usePolling(load, 120_000, canView);

  return null;
}
