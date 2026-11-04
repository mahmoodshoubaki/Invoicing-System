'use client';

import { useEffect, useState } from 'react';

import { projectRepository } from '@/repositories/projectRepository';

/**
 * A project's header from GetProjectHeader. `error` covers a project the user
 * may not see as well as a failed call.
 *
 * @param {string} projectCode
 * @returns {{ status: 'loading'|'ready'|'error', header: Object|null }}  header: mapProjectHeader's
 */
export function useProjectHeader(projectCode) {
  const [state, setState] = useState({ code: null, status: 'loading', header: null });

  useEffect(() => {
    if (!projectCode) return undefined;
    let cancelled = false;
    projectRepository.getProjectHeader(projectCode)
      .then((header) => {
        if (!cancelled) setState({ code: projectCode, status: header ? 'ready' : 'error', header });
      })
      .catch(() => {
        if (!cancelled) setState({ code: projectCode, status: 'error', header: null });
      });
    return () => { cancelled = true; };
  }, [projectCode]);

  return state.code === projectCode ? state : { status: 'loading', header: null };
}
