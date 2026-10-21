'use client';

import { useEffect, useState } from 'react';

import { INSTANCE_STATUS } from '@/constants/workflow';
import { workflowRepository } from '@/repositories/workflowRepository';

const NONE = [];

/**
 * The ids of the runs still going on one record (2026-10-13) —
 * `GetInstances?statusKey=1&targetTypeKey=…&targetId=…`.
 *
 * For a record whose reply does not name its run: a BOQ item's does not (an
 * invoice's carries `workflowInstanceId`), so its page asks for the runs on
 * it. GetInstances needs WorkflowInstances.View; without it `enabled` is false,
 * nothing is asked, and there is simply no task to show.
 *
 * @param {number} targetTypeKey
 * @param {string|number|null} targetId
 * @param {boolean} enabled
 * @returns {string[]}
 */
export function useRecordRuns(targetTypeKey, targetId, enabled) {
  const key = targetId == null ? '' : `${targetTypeKey}:${targetId}`;
  const [loaded, setLoaded] = useState({ key: null, ids: NONE });

  useEffect(() => {
    if (!enabled || !key) return undefined;
    let cancelled = false;
    workflowRepository
      .getInstances({ statusKey: INSTANCE_STATUS.RUNNING, targetTypeKey, targetId, take: 20 })
      .then((result) => {
        if (!cancelled) setLoaded({ key, ids: result.items.map((run) => run.instanceId).filter(Boolean) });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, ids: NONE });
      });
    return () => { cancelled = true; };
  }, [enabled, key, targetTypeKey, targetId]);

  return enabled && loaded.key === key ? loaded.ids : NONE;
}
