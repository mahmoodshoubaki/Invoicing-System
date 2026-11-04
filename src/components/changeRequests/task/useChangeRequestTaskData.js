'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { boqRepository } from '@/repositories/boqRepository';
import { changeRequestRepository } from '@/repositories/changeRequestRepository';
import { projectRepository } from '@/repositories/projectRepository';
import { draftFromChangeRequest, itemIdsOf } from '@/lib/changeRequest/fromChangeRequest';
import { subProjectOriginals } from '@/lib/changeRequest/projectDraft';
import { asksForChanges, changeRequestFromTask, rowsKeptAsIs } from '@/lib/changeRequest/taskFields';
import { selectBoqItemStatusesMap } from '@/store/slices/lookupsSlice';

const NONE = [];
const NOTHING_KEPT = { fieldChanges: [], cycleChanges: [] };

/**
 * @param {Object} task
 * @param {ReturnType<import('@/lib/changeRequest/taskFields').changeRequestTaskParts>} parts
 */
export function useChangeRequestTaskData(task, parts) {
  const statusesMap = useSelector(selectBoqItemStatusesMap);
  const changeRequestId = task.targetIds?.length === 1 ? task.targetIds[0] : null;
  const changes = asksForChanges(parts);
  const [state, setState] = useState({ status: 'loading', error: null, data: null });
  const [token, setToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let loaded = null;
        let loadError = null;
        if (changeRequestId != null) {
          try {
            loaded = await changeRequestRepository.getChangeRequestById(changeRequestId);
          } catch (err) {
            loadError = err;
          }
        }
        if (!loaded && changes && Boolean(parts.fieldChanges) !== Boolean(parts.cycleChanges)) {
          throw loadError ?? new Error('This task is not about one change request, so its changes can’t be shown.');
        }

        const { changeRequest, unreadable } = changeRequestFromTask(parts, loaded);
        if (unreadable.length) {
          throw new Error(`${unreadable.join(' and ')} could not be read from this task. Open the change request instead.`);
        }

        let boqItems = NONE;
        let subProjects = NONE;
        let cyclesByItem = {};
        if (changes) {
          const projectCode = loaded?.projectCode ?? task.projectCode;
          if (!projectCode) throw new Error('This task does not say which project the change request is on.');
          const [boq, rawSubProjects] = await Promise.all([
            boqRepository.getBOQByProjectCode(projectCode),
            projectRepository.getSubProjectsSummary(projectCode),
          ]);
          boqItems = boq?.boqItems ?? NONE;
          subProjects = subProjectOriginals(rawSubProjects);
          const known = new Set(boqItems.map((i) => String(i.id)));
          const ids = itemIdsOf(changeRequest).filter((id) => known.has(id));
          const plans = await Promise.all(ids.map((id) => boqRepository.getTrackerCycles(id)));
          cyclesByItem = Object.fromEntries(ids.map((id, i) => [id, plans[i]]));
        }

        if (cancelled) return;
        setState({
          status: 'ready',
          error: null,
          data: {
            boqItems,
            subProjects,
            initial: draftFromChangeRequest(changeRequest, { boqItems, cyclesByItem, subProjects }),
            kept: changes ? rowsKeptAsIs(changeRequest, { boqItems, subProjects }) : NOTHING_KEPT,
          },
        });
      } catch (error) {
        if (!cancelled) setState({ status: 'error', error, data: null });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeRequestId, changes, token]);

  const retry = useCallback(() => {
    setState({ status: 'loading', error: null, data: null });
    setToken((n) => n + 1);
  }, []);
  const statusNameOf = useCallback((statusId) => statusesMap[statusId] ?? null, [statusesMap]);

  return useMemo(() => ({ ...state, statusNameOf, retry }), [state, statusNameOf, retry]);
}
