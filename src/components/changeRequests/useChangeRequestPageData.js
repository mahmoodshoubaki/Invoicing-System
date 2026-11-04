'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { subProjectOriginals } from '@/lib/changeRequest/projectDraft';
import { selectBoqItemStatusesMap, selectChangeRequestReasons } from '@/store/slices/lookupsSlice';
import { fetchBOQByProjectCode, selectBOQItems, selectBOQLoading, selectCurrentBOQ } from '@/store/slices/boqSlice';
import { fetchSubProjectsSummary, selectSubProjects, selectSubProjectsLoading } from '@/store/slices/projectsSlice';

/**
 * @param {string} projectCode
 */
export function useChangeRequestPageData(projectCode) {
  const dispatch = useDispatch();
  const boq = useSelector(selectCurrentBOQ);
  const boqItems = useSelector(selectBOQItems);
  const boqLoading = useSelector(selectBOQLoading);
  const rawSubProjects = useSelector(selectSubProjects);
  const subProjectsLoading = useSelector(selectSubProjectsLoading);
  const statusesMap = useSelector(selectBoqItemStatusesMap);
  const reasons = useSelector(selectChangeRequestReasons);

  useEffect(() => {
    dispatch(fetchSubProjectsSummary(projectCode));
    dispatch(fetchBOQByProjectCode(projectCode));
  }, [dispatch, projectCode]);

  const subProjects = useMemo(() => subProjectOriginals(rawSubProjects), [rawSubProjects]);
  const statusNameOf = useCallback((statusId) => statusesMap[statusId] ?? null, [statusesMap]);

  return {
    boq,
    boqItems,
    subProjects,
    statusNameOf,
    reasons,
    loading: boqLoading || subProjectsLoading,
  };
}
