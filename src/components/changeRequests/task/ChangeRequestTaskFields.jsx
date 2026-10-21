'use client';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorNote from '@/components/ui/ErrorNote';
import { partsAsked } from '@/lib/changeRequest/taskFields';
import { selectChangeRequestReasons } from '@/store/slices/lookupsSlice';
import ChangeRequestTaskEditor from './ChangeRequestTaskEditor';
import { useChangeRequestTaskData } from './useChangeRequestTaskData';

/**
 * The change request fields a workflow task asks for (2026-10-20) — its
 * reasons, its details, its item and project changes, its plan changes — on
 * My Tasks and on the request's own page. Loads what drawing them needs, then
 * the editor; until then the task's saving buttons wait (useTaskForm says so).
 *
 * @param {{ task: Object, parts: Object, handleRef: { current: Object|null } }} props
 */
export default function ChangeRequestTaskFields({ task, parts, handleRef }) {
  const asks = useMemo(() => partsAsked(parts), [parts]);
  const data = useChangeRequestTaskData(task, parts);
  const reasons = useSelector(selectChangeRequestReasons);

  if (data.status === 'error') {
    return <ErrorNote error={data.error} onRetry={data.retry} />;
  }
  if (data.status !== 'ready') {
    return <div className="flex h-32 items-center justify-center"><LoadingSpinner /></div>;
  }
  return (
    <ChangeRequestTaskEditor
      parts={parts}
      asks={asks}
      reasons={reasons}
      data={{ ...data.data, statusNameOf: data.statusNameOf }}
      handleRef={handleRef}
    />
  );
}
