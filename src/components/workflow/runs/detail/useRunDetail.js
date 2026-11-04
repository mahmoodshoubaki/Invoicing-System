'use client';

import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { usePermission } from '@/hooks/usePermission';
import { usePolling } from '@/hooks/usePolling';
import { allow, WORKFLOW_INSTANCE_PERMISSIONS, WORKFLOW_PERMISSIONS } from '@/constants/workflowPermissions';
import { INSTANCE_STATUS } from '@/constants/workflow';
import {
  fetchInstance, fetchInstanceHistory, fetchInstanceTasks,
  selectDetailForInstance, selectInstance, selectInstanceError, selectInstanceHistory, selectInstanceHistoryLoaded,
  selectInstanceLoading, selectInstanceTasks, selectInstanceTasksLoaded, selectIsAdvancing,
} from '@/store/slices/workflowRunsSlice';
import { fetchDefinitions, selectDefinitions } from '@/store/slices/workflowSlice';

const POLL_INTERVAL_MS = 30_000;

const EMPTY = [];

/**
 * @param {string} instanceId
 */
export function useRunDetail(instanceId) {
  const dispatch = useDispatch();
  const { can } = usePermission();
  const canView = allow(can, WORKFLOW_INSTANCE_PERMISSIONS.VIEW);

  const selected = useSelector(selectInstance);
  const loading = useSelector(selectInstanceLoading);
  const error = useSelector(selectInstanceError);
  const busy = useSelector(selectIsAdvancing);

  const run = selected?.instanceId === instanceId ? selected : null;

  const detailFor = useSelector(selectDetailForInstance);
  const mine = detailFor === instanceId;

  const allTasks = useSelector(selectInstanceTasks);
  const tasksLoaded = useSelector(selectInstanceTasksLoaded) && mine;
  const historyRows = useSelector(selectInstanceHistory);
  const historyLoaded = useSelector(selectInstanceHistoryLoaded) && mine;

  const definitions = useSelector(selectDefinitions);
  const canViewDefinitions = allow(can, WORKFLOW_PERMISSIONS.VIEW);

  useEffect(() => {
    if (canViewDefinitions && definitions.length === 0) dispatch(fetchDefinitions());
  }, [canViewDefinitions, definitions.length, dispatch]);

  const targetTypeKey = run?.targetTypeKey
    ?? definitions.find((d) => d.code === run?.definitionCode)?.targetTypeKey
    ?? null;

  const load = useCallback(() => {
    if (!instanceId) return;
    dispatch(fetchInstance(instanceId));
    dispatch(fetchInstanceTasks({ instanceId, take: 100 }));
    dispatch(fetchInstanceHistory({ instanceId, take: 100 }));
  }, [dispatch, instanceId]);

  useEffect(() => { load(); }, [load]);

  const settled = run?.statusKey === INSTANCE_STATUS.COMPLETED
    || run?.statusKey === INSTANCE_STATUS.CANCELLED;
  usePolling(load, POLL_INTERVAL_MS, canView && Boolean(instanceId) && !settled);

  return {
    canView, run, loading, error, busy, targetTypeKey, load,
    tasks: mine ? allTasks : EMPTY,
    tasksLoaded,
    history: mine ? historyRows : EMPTY,
    historyLoaded,
  };
}
