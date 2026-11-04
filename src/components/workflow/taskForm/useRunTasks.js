'use client';

import { useCallback, useEffect, useState } from 'react';

import { TASK_STATUS } from '@/constants/workflow';
import { workflowRepository } from '@/repositories/workflowRepository';

const NONE = [];

/**
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
      .catch(() => {
        if (!cancelled) setLoaded({ key, tasks: NONE });
      });
    return () => { cancelled = true; };
  }, [enabled, key, token]);

  const reload = useCallback(() => setToken((n) => n + 1), []);

  const tasks = enabled && key && loaded.key === key
    ? loaded.tasks.filter((t) => t.canAct && (t.statusKey ?? TASK_STATUS.PENDING) === TASK_STATUS.PENDING)
    : NONE;

  return { tasks, reload };
}
