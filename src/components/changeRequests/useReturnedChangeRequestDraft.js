'use client';

import { useEffect, useState } from 'react';

import { boqRepository } from '@/repositories/boqRepository';
import { changeRequestRepository } from '@/repositories/changeRequestRepository';
import { draftFromChangeRequest, itemIdsOf } from '@/lib/changeRequest/fromChangeRequest';

/**
 * A returned change request, loaded and turned back into a draft (2026-10-19):
 * the request, the invoicing plans of the items it touches, and the draft
 * those make — once the BOQ and the sub-projects are loaded too.
 *
 * @param {string|number} crId
 * @param {{ boqItems: Array, subProjects: Array, loading: boolean }} data  useChangeRequestPageData's
 * @returns {{ changeRequest: Object|null, initial: Object|null, error: Error|null }}
 */
export function useReturnedChangeRequestDraft(crId, data) {
  const [state, setState] = useState({ changeRequest: null, cyclesByItem: null, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const changeRequest = await changeRequestRepository.getChangeRequestById(crId);
        const ids = itemIdsOf(changeRequest);
        const plans = await Promise.all(ids.map((id) => boqRepository.getTrackerCycles(id)));
        if (!cancelled) setState({ changeRequest, cyclesByItem: Object.fromEntries(ids.map((id, i) => [id, plans[i]])), error: null });
      } catch (error) {
        if (!cancelled) setState({ changeRequest: null, cyclesByItem: null, error });
      }
    })();
    return () => { cancelled = true; };
  }, [crId]);

  const ready = state.changeRequest && state.cyclesByItem && !data.loading;
  return {
    changeRequest: state.changeRequest,
    error: state.error,
    initial: ready
      ? draftFromChangeRequest(state.changeRequest, { boqItems: data.boqItems, cyclesByItem: state.cyclesByItem, subProjects: data.subProjects })
      : null,
  };
}
