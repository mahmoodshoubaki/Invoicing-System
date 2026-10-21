'use client';

import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { subProjectOriginals } from '@/lib/changeRequest/projectDraft';
import {
  fetchMainProjectDetails, selectMainProjectDetails, selectMainDetailsLoading,
  fetchSubProjectsSummary, selectSubProjects, selectSubProjectsLoading,
} from '@/store/slices/projectsSlice';

/**
 * What ProjectSummaryCard needs, for a page that loads nothing else of the
 * project (2026-10-21) — its contract name and its EPM sub-projects, read as
 * the change request form reads them.
 *
 * @param {string} projectCode
 * @returns {{ contractName: string|null, subProjects: Array, loading: boolean }}
 */
export function useProjectSummary(projectCode) {
  const dispatch = useDispatch();
  const project = useSelector(selectMainProjectDetails);
  const projectLoading = useSelector(selectMainDetailsLoading);
  const rawSubProjects = useSelector(selectSubProjects);
  const subProjectsLoading = useSelector(selectSubProjectsLoading);

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
    dispatch(fetchSubProjectsSummary(projectCode));
  }, [dispatch, projectCode]);

  const subProjects = useMemo(() => subProjectOriginals(rawSubProjects), [rawSubProjects]);
  return { contractName: project?.contractName ?? null, subProjects, loading: projectLoading || subProjectsLoading };
}
