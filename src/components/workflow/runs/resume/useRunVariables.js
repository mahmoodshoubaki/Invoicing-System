'use client';

import { useEffect, useState } from 'react';

import { workflowRepository } from '@/repositories/workflowRepository';
import { identityRepository } from '@/repositories/identityRepository';
import { VARIABLE_TYPE } from '@/constants/workflow';
import { PERSON_ID } from '@/lib/workflowFieldOptions';
import { variableRows } from '@/lib/runVariables';

const NONE = [];

/**
 * A run's values as rows to correct (2026-10-21), loaded as the resume dialog
 * opens — and the names of the people its person values hold, so a picker
 * shows a name rather than an id. Only ids are looked up; a name that cannot
 * be found leaves the id showing.
 *
 * @param {string} instanceId
 * @returns {{ status: 'loading'|'ready'|'error', rows: Array, people: Object, error: Error|null }}
 */
export function useRunVariables(instanceId) {
  const [state, setState] = useState({ status: 'loading', rows: NONE, people: {}, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = variableRows(await workflowRepository.getInstanceVariables(instanceId));
        const ids = [...new Set(rows.filter((r) => r.type === VARIABLE_TYPE.USER && PERSON_ID.test(r.text)).map((r) => r.text))];
        let people = {};
        if (ids.length > 0) {
          try {
            const users = await identityRepository.getAuthorizedUsers({ ids });
            people = Object.fromEntries(users.filter((u) => u.id).map((u) => [u.id, u]));
          } catch {
            // Names are a nicety: without them the ids show.
          }
        }
        if (!cancelled) setState({ status: 'ready', rows, people, error: null });
      } catch (error) {
        if (!cancelled) setState({ status: 'error', rows: NONE, people: {}, error });
      }
    })();
    return () => { cancelled = true; };
  }, [instanceId]);

  return state;
}
