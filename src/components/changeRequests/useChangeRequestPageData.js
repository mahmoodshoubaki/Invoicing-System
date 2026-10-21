'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { subProjectOriginals } from '@/lib/changeRequest/projectDraft';
import { selectBoqItemStatusesMap, selectChangeRequestReasons } from '@/store/slices/lookupsSlice';
import { fetchBOQByProjectCode, selectBOQItems, selectBOQLoading, selectCurrentBOQ } from '@/store/slices/boqSlice';
import {
  fetchMainProjectDetails, selectMainProjectDetails, selectMainDetailsLoading,
  fetchSubProjectsSummary, selectSubProjects, selectSubProjectsLoading,
} from '@/store/slices/projectsSlice';

/**
 * What writing a change request needs (2026-10-19): the project, its BOQ and
 * items, its EPM sub-projects (their values and contract dates, named by
 * projectUID), and the reasons — read as the BOQ pages read them.
 *
 * @param {string} projectCode
 */
export function useChangeRequestPageData(projectCode) {
  const dispatch = useDispatch();
  const project = useSelector(selectMainProjectDetails);
  const projectLoading = useSelector(selectMainDetailsLoading);
  const boq = useSelector(selectCurrentBOQ);
  const boqItems = useSelector(selectBOQItems);
  const boqLoading = useSelector(selectBOQLoading);
  const rawSubProjects = useSelector(selectSubProjects);
  const subProjectsLoading = useSelector(selectSubProjectsLoading);
  const statusesMap = useSelector(selectBoqItemStatusesMap);
  const reasons = useSelector(selectChangeRequestReasons);

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
    dispatch(fetchSubProjectsSummary(projectCode));
    dispatch(fetchBOQByProjectCode(projectCode));
  }, [dispatch, projectCode]);

  const subProjects = useMemo(() => subProjectOriginals(rawSubProjects), [rawSubProjects]);
  const statusNameOf = useCallback((statusId) => statusesMap[statusId] ?? null, [statusesMap]);

  return {
    project,
    boq,
    boqItems,
    subProjects,
    statusNameOf,
    reasons,
    loading: projectLoading || boqLoading || subProjectsLoading,
  };
}
