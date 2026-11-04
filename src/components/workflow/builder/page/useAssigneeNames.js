'use client';

import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { BuilderActions, referencedPersonIds } from '@/lib/workflowBuilderState';
import { resolveAssignees } from '@/store/slices/workflowSlice';

/**
 * @param {{ state: Object, dispatch: Function, resolvedById: Object }} options
 */
export function useAssigneeNames({ state, dispatch, resolvedById }) {
  const dispatchRedux = useDispatch();

  const assigneeIds = useMemo(() => {
    const ids = new Set();
    const walk = (steps) => {
      for (const step of steps ?? []) {
        for (const id of step.assignToUserIds ?? []) ids.add(id);
        walk(step.whenTrue);
        walk(step.whenFalse);
        walk(step.body);
        for (const branch of step.branches ?? []) walk(branch.steps);
      }
    };
    for (const stage of state.graph.stages) walk(stage.steps);
    return [...ids].sort();
  }, [state.graph]);

  const assigneeKey = assigneeIds.join(',');

  const lookupIds = useMemo(
    () => [...new Set([...assigneeIds, ...referencedPersonIds(state)])].sort(),
    [assigneeIds, state]
  );
  const lookupKey = lookupIds.join(',');
  useEffect(() => {
    if (lookupIds.length > 0) dispatchRedux(resolveAssignees(lookupIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupKey, dispatchRedux]);

  useEffect(() => {
    const invalid = new Map();

    for (const id of assigneeIds) {
      const user = resolvedById[id];
      if (!user) continue;
      if (user.missing) invalid.set(id, { displayName: null, reason: 'missing' });
      else if (user.isActive === false) invalid.set(id, { displayName: user.displayName, reason: 'inactive' });
    }

    if (invalid.size > 0) dispatch({ type: BuilderActions.PRUNE_ASSIGNEES, invalid });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assigneeKey, resolvedById]);
}
