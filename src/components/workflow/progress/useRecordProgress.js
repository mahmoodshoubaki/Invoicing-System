'use client';

import { useEffect, useState } from 'react';

import { workflowRepository } from '@/repositories/workflowRepository';
import { usePermission } from '@/hooks/usePermission';
import { allow, WORKFLOW_INSTANCE_PERMISSIONS, WORKFLOW_PERMISSIONS } from '@/constants/workflowPermissions';
import { pickRun } from '@/lib/workflowProgress';

const NOTHING = { run: null, history: [], graph: null };

/**
 * What a record's stepper can know of the workflow deciding it (2026-10-21) —
 * a change request, an invoice or a BOQ item: its run (the live one, or the
 * latest), that run's history, and its workflow version's stages. Each only
 * for a reader who may see it: runs need WorkflowInstances.View, the workflow
 * Workflows.View. Without them the stepper still works from the record alone.
 *
 * Read again whenever the record is (a new object after a task is answered);
 * what was found stays on screen until the new answer lands.
 *
 * @param {number} targetTypeKey  TARGET_TYPE's
 * @param {Object|null} record  with an `id`; null when there is none yet
 * @returns {{ ready: boolean, run: Object|null, history: Array, graph: Object|null }}
 */
export function useRecordProgress(targetTypeKey, record) {
  const { can } = usePermission();
  const canRuns = allow(can, WORKFLOW_INSTANCE_PERMISSIONS.VIEW);
  const canWorkflows = allow(can, WORKFLOW_PERMISSIONS.VIEW);
  const [loaded, setLoaded] = useState({ for: null, ...NOTHING });

  useEffect(() => {
    if (!record || !canRuns) return undefined;
    let cancelled = false;
    (async () => {
      let found = NOTHING;
      try {
        const { items } = await workflowRepository.getInstances({ targetTypeKey, targetId: record.id, take: 20 });
        const run = pickRun(items);
        if (run) {
          const [history, graph] = await Promise.all([
            workflowRepository.getInstanceHistory({ instanceId: run.instanceId, take: 100 })
              .then((r) => r.items)
              .catch(() => []),
            canWorkflows
              ? workflowRepository.getDefinition({ code: run.definitionCode, version: run.definitionVersion })
                .then((d) => d?.graph ?? null)
                .catch(() => null)
              : Promise.resolve(null),
          ]);
          found = { run, history, graph };
        }
      } catch {
        // The record's own progress still shows.
      }
      if (!cancelled) setLoaded({ for: record, ...found });
    })();
    return () => { cancelled = true; };
  }, [targetTypeKey, record, canRuns, canWorkflows]);

  if (!record || !canRuns) return { ready: true, ...NOTHING };
  return String(loaded.for?.id) === String(record.id)
    ? { ready: true, run: loaded.run, history: loaded.history, graph: loaded.graph }
    : { ready: false, ...NOTHING };
}
