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

/** No push — SignalR is parked — so this is the only way the screen learns anything. */
const POLL_INTERVAL_MS = 30_000;

/** Stable identity, so a guarded-out list does not re-run every memo below. */
const EMPTY = [];

/**
 * One run, its tasks and its history — fetched on arrival, kept fresh by
 * polling while the run can still change, and never shown under another run's id.
 *
 * Three calls, not one. `GetInstance` stopped carrying `pendingTasks` and
 * `history` on 2026-09-13 — both are unbounded and both page, so they became
 * endpoints of their own. The trade is worth naming: the timeline costs a
 * second request, and in exchange the tasks call returns **every** task rather
 * than only the open ones, which is what makes a run's audit trail readable.
 *
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

  /*
   * Never render a run under somebody else's id.
   *
   * `selected` holds whichever run was fetched LAST, and the monitoring list
   * fetches one of its own to fill the Resume dialog — so arriving here can find
   * a completely different run already in the store. Without this the page drew
   * that run's status, history and pending tasks until the real one landed,
   * which is worse than drawing nothing: it is confidently wrong.
   *
   * Guarding on identity rather than clearing the store on `pending`, because
   * clearing would also blank the whole page on every 30-second poll.
   */
  const run = selected?.instanceId === instanceId ? selected : null;

  // Same guard for the two side lists: the slice keys them to a run, so a
  // mismatch means they belong to whichever run was open before this one.
  const detailFor = useSelector(selectDetailForInstance);
  const mine = detailFor === instanceId;

  const allTasks = useSelector(selectInstanceTasks);
  const tasksLoaded = useSelector(selectInstanceTasksLoaded) && mine;
  const historyRows = useSelector(selectInstanceHistory);
  const historyLoaded = useSelector(selectInstanceHistoryLoaded) && mine;

  /*
   * Which kind of record `targetIds` are — invoices, BOQ items — so they can be
   * linked to rather than printed as ids.
   *
   * The run does not say. `GetInstance` carries what a run is about, never what
   * that IS, so the workflow's own definition row supplies it, matched on
   * `definitionCode`. `run.targetTypeKey` is preferred the day the backend puts
   * it on the response, and then this list is never needed.
   *
   * Fetched only with `Workflows.View`: somebody who may watch runs need not be
   * allowed to see the workflows behind them, and without it the targets stay
   * plain ids rather than the page failing.
   */
  const definitions = useSelector(selectDefinitions);
  const canViewDefinitions = allow(can, WORKFLOW_PERMISSIONS.VIEW);

  useEffect(() => {
    if (canViewDefinitions && definitions.length === 0) dispatch(fetchDefinitions());
  }, [canViewDefinitions, definitions.length, dispatch]);

  const targetTypeKey = run?.targetTypeKey
    ?? definitions.find((d) => d.code === run?.definitionCode)?.targetTypeKey
    ?? null;

  // No `statusKey` on the tasks call: all statuses is the point.
  const load = useCallback(() => {
    if (!instanceId) return;
    dispatch(fetchInstance(instanceId));
    dispatch(fetchInstanceTasks({ instanceId, take: 100 }));
    dispatch(fetchInstanceHistory({ instanceId, take: 100 }));
  }, [dispatch, instanceId]);

  useEffect(() => { load(); }, [load]);

  // A finished run will never change again, so polling it is pure noise.
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
