'use client';

import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { BuilderActions, referencedPersonIds } from '@/lib/workflowBuilderState';
import { resolveAssignees } from '@/store/slices/workflowSlice';

/**
 * Looks up every person the definition names, and drops assignees who can no
 * longer answer a task.
 *
 * @param {{ state: Object, dispatch: Function, resolvedById: Object }} options
 */
export function useAssigneeNames({ state, dispatch, resolvedById }) {
  const dispatchRedux = useDispatch();

  /**
   * Assignees arrive as bare GUIDs on a loaded definition, so their names have
   * to be looked up before anything can show who a task is for.
   *
   * Keyed on the sorted id list rather than the graph: retyping a step title
   * would otherwise re-run this on every keystroke, and the set of people
   * assigned changes far less often than the graph does.
   */
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

  /*
   * Everybody else the definition names — a person variable's starting value,
   * a condition comparing against a person — looked up too, so they read as
   * names. Only `assigneeIds` are pruned below: somebody who has left is still
   * worth showing by name in a condition, but cannot be handed a task.
   */
  const lookupIds = useMemo(
    () => [...new Set([...assigneeIds, ...referencedPersonIds(state)])].sort(),
    [assigneeIds, state]
  );
  const lookupKey = lookupIds.join(',');
  useEffect(() => {
    if (lookupIds.length > 0) dispatchRedux(resolveAssignees(lookupIds));
    // `lookupKey` is the real dependency — the array identity changes on every
    // graph edit, its contents almost never do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupKey, dispatchRedux]);

  /**
   * Once the lookup lands, drop anyone who cannot answer a task.
   *
   * Only ids that came back resolved are judged — an id still in flight is
   * absent from the cache and must not be mistaken for a departed user. This
   * converges: pruning removes those ids from the graph, so the next pass has
   * nothing left to find.
   */
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
