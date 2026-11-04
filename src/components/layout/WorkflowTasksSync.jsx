'use client';

import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { fetchPendingCount } from '@/store/slices/workflowTasksSlice';
import { usePermission } from '@/hooks/usePermission';
import { usePolling } from '@/hooks/usePolling';
import { allow, WORKFLOW_TASK_PERMISSIONS } from '@/constants/workflowPermissions';

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
