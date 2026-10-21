'use client';

import { useEffect, useState } from 'react';

import { projectRepository } from '@/repositories/projectRepository';

const NOBODY = { bdm: null, buHead: null, crp: null };

/**
 * A project's people from EPM (2026-10-21) — its BDM, BU head and CRP, by
 * display name — read from GetProjectDetails, the one call that has them.
 * `status` says whether they are still loading, or could not be read (no
 * access, or EPM down), so a screen can say which rather than show blanks.
 *
 * @param {string} projectCode
 * @returns {{ status: 'loading'|'ready'|'error', bdm: string|null, buHead: string|null, crp: string|null }}
 */
export function useProjectTeam(projectCode) {
  const [state, setState] = useState({ code: null, status: 'loading', ...NOBODY });

  useEffect(() => {
    if (!projectCode) return undefined;
    let cancelled = false;
    projectRepository.getProjectDetails(projectCode)
      .then((project) => {
        if (cancelled) return;
        setState(project
          ? { code: projectCode, status: 'ready', bdm: project.bdm, buHead: project.buHead, crp: project.crp }
          : { code: projectCode, status: 'error', ...NOBODY });
      })
      .catch(() => {
        if (!cancelled) setState({ code: projectCode, status: 'error', ...NOBODY });
      });
    return () => { cancelled = true; };
  }, [projectCode]);

  return state.code === projectCode ? state : { code: projectCode, status: 'loading', ...NOBODY };
}
