'use client';

import { useEffect, useState } from 'react';

import { useDebounce } from '@/hooks/useDebounce';
import { projectRepository } from '@/repositories/projectRepository';

/**
 * The first `take` projects matching `query`, searched by the server, and every
 * project seen so far by code (to name picked ones).
 *
 * @returns {{ projects: Object[]|null, known: Object<string, Object>, error: Error|null }}  projects: null while loading
 */
export function useProjectSearch(query, take) {
  const search = useDebounce(query.trim(), 250);
  const [state, setState] = useState({ key: null, projects: null, error: null });
  const [known, setKnown] = useState({});
  const key = `${search}|${take}`;

  useEffect(() => {
    let cancelled = false;
    projectRepository.getProjectsPage({ search, skip: 0, take })
      .then(({ projects }) => {
        if (cancelled) return;
        const rows = projects.filter((p) => p.projectCode);
        setState({ key, projects: rows, error: null });
        setKnown((prev) => ({ ...prev, ...Object.fromEntries(rows.map((p) => [p.projectCode, p])) }));
      })
      .catch((error) => {
        if (!cancelled) setState({ key, projects: [], error });
      });
    return () => { cancelled = true; };
  }, [key, search, take]);

  return {
    projects: state.key === key ? state.projects : null,
    known,
    error: state.error,
  };
}
