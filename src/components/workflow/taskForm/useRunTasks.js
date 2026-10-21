'use client';

import { useCallback, useEffect, useState } from 'react';

import { TASK_STATUS } from '@/constants/workflow';
import { workflowRepository } from '@/repositories/workflowRepository';

const NONE = [];

/**
 * The open to-dos of a record's runs that the signed-in person may answer
 * (2026-10-11) — `GetMyTasks?instanceId=…&statusKey=1` per run, filtered to
 * `canAct`. This is how a record's own page finds the task waiting on it.
 *
 * An invoice has one run (its `workflowInstanceId`); a BOQ item can have
 * several at once (2026-10-13), so this takes one id or a list.
 *
 * `enabled` is false without WorkflowTasks.View, which GetMyTasks needs: then
 * nothing is asked, and the page simply has no task to show.
 *
 * @param {string|string[]|null} instanceIds
 * @param {boolean} enabled
 * @returns {{ tasks: Array, reload: () => void }}
 */
export function useRunTasks(instanceIds, enabled) {
  // One string stands for the list, so a new array with the same ids is not a new ask.
  const key = (Array.isArray(instanceIds) ? instanceIds : [instanceIds]).filter(Boolean).join(',');
  const [loaded, setLoaded] = useState({ key: null, tasks: NONE });
  const [token, setToken] = useState(0);

  useEffect(() => {
    if (!enabled || !key) return undefined;
    let cancelled = false;
    Promise.all(
      key.split(',').map((instanceId) => workflowRepository
        .getMyTasks({ instanceId, statusKey: TASK_STATUS.PENDING })
        .then((result) => result.items))
    )
      .then((lists) => {
        if (!cancelled) setLoaded({ key, tasks: lists.flat() });
      })
      // No task is shown rather than an error: the record's page works without it.
      .catch(() => {
        if (!cancelled) setLoaded({ key, tasks: NONE });
      });
    return () => { cancelled = true; };
  }, [enabled, key, token]);

  const reload = useCallback(() => setToken((n) => n + 1), []);

  // Only these runs', and only the ones this person can answer.
  const tasks = enabled && key && loaded.key === key
    ? loaded.tasks.filter((t) => t.canAct && (t.statusKey ?? TASK_STATUS.PENDING) === TASK_STATUS.PENDING)
    : NONE;

  return { tasks, reload };
}
