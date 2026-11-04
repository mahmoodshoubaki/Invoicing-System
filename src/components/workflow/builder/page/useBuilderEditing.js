'use client';

import { useCallback, useState } from 'react';

import { MATCH } from '@/constants/workflow';
import { operatorsForField } from '@/lib/filterDescription';
import { BuilderActions, getStepContainer } from '@/lib/workflowBuilderState';
import { createFilterCondition } from '@/models/workflow';

function countNested(step) {
  if (!step) return 0;
  const lists = [step.whenTrue, step.whenFalse, step.body, ...(step.branches ?? []).map((b) => b.steps)];
  return lists.reduce((total, list) => total + (list ?? []).length, 0);
}

/**
 * @param {{ stages: Array, fields: Array, dispatch: Function }} options
 */
export function useBuilderEditing({ stages, fields, dispatch }) {
  const [pendingDelete, setPendingDelete] = useState(null);

  const onUpdateStage = useCallback((stageId, patch) => dispatch({ type: BuilderActions.UPDATE_STAGE, stageId, patch }), [dispatch]);

  const onRemoveStage = useCallback((stageId) => {
    const stage = stages.find((s) => s.id === stageId);
    const steps = stage?.steps?.length ?? 0;
    const transitions = stage?.transitions?.length ?? 0;

    if (steps === 0 && transitions === 0 && !stage?.deadline) {
      dispatch({ type: BuilderActions.REMOVE_STAGE, stageId });
      return;
    }

    const parts = [];
    if (steps > 0) parts.push(`${steps} step${steps === 1 ? '' : 's'}`);
    if (transitions > 0) parts.push(`${transitions} transition${transitions === 1 ? '' : 's'}`);
    if (stage?.deadline) parts.push('its deadline');

    setPendingDelete({
      title: `Delete "${stage.title || stageId}"?`,
      message: `This also removes ${parts.join(', ')}. Anything pointing at this stage will need a new target.`,
      confirmLabel: 'Delete stage',
      run: () => dispatch({ type: BuilderActions.REMOVE_STAGE, stageId }),
    });
  }, [dispatch, stages]);
  const onAddStage = useCallback(() => dispatch({ type: BuilderActions.ADD_STAGE }), [dispatch]);
  const onMoveStage = useCallback((from, to) => dispatch({ type: BuilderActions.MOVE_STAGE, from, to }), [dispatch]);
  const onSetStart = useCallback((stageId) => dispatch({ type: BuilderActions.SET_START_STAGE, stageId }), [dispatch]);
  const onCommitStageTitle = useCallback((stageId) => dispatch({ type: BuilderActions.COMMIT_STAGE_TITLE, stageId }), [dispatch]);
  const onSetDeadline = useCallback((stageId, deadline) => dispatch({ type: BuilderActions.SET_STAGE_DEADLINE, stageId, deadline }), [dispatch]);

  // -------------------------------------------------------------------------- transitions
  const onAddTransition = useCallback((stageId) => {
    const first = fields[0];
    dispatch({
      type: BuilderActions.ADD_TRANSITION,
      stageId,
      condition: first
        ? { match: MATCH.ALL, groups: [], conditions: [createFilterCondition({
            field: first.name,
            operator: operatorsForField(first.name, fields)[0],
            value: '',
          })] }
        : undefined,
    });
  }, [dispatch, fields]);
  const onUpdateTransition = useCallback((stageId, index, patch) => dispatch({ type: BuilderActions.UPDATE_TRANSITION, stageId, index, patch }), [dispatch]);
  const onRemoveTransition = useCallback((stageId, index) => dispatch({ type: BuilderActions.REMOVE_TRANSITION, stageId, index }), [dispatch]);
  const onMoveTransition = useCallback((stageId, from, to) => dispatch({ type: BuilderActions.MOVE_TRANSITION, stageId, from, to }), [dispatch]);
  const onSetCatchAll = useCallback((stageId, enabled, toStageId = null) => dispatch({ type: BuilderActions.SET_CATCH_ALL, stageId, enabled, toStageId }), [dispatch]);

  const onAddStep = useCallback((stageId, container, step) => dispatch({ type: BuilderActions.ADD_STEP, stageId, container, step }), [dispatch]);
  const onUpdateStep = useCallback((stageId, container, index, patch) => dispatch({ type: BuilderActions.UPDATE_STEP, stageId, container, index, patch }), [dispatch]);
  const onRemoveStep = useCallback((stageId, container, index) => {
    const stage = stages.find((s) => s.id === stageId);
    const step = stage ? getStepContainer(stage, container)?.[index] : null;
    const nested = countNested(step);

    if (nested === 0) {
      dispatch({ type: BuilderActions.REMOVE_STEP, stageId, container, index });
      return;
    }

    setPendingDelete({
      title: `Delete "${step.title || 'this step'}"?`,
      message: `It holds ${nested} step${nested === 1 ? '' : 's'}, which go with it.`,
      confirmLabel: 'Delete step',
      run: () => dispatch({ type: BuilderActions.REMOVE_STEP, stageId, container, index }),
    });
  }, [dispatch, stages]);
  const onMoveStep = useCallback((stageId, container, from, to) => dispatch({ type: BuilderActions.MOVE_STEP, stageId, container, from, to }), [dispatch]);
  const onCommitStepTitle = useCallback((stageId, container, index) => dispatch({ type: BuilderActions.COMMIT_STEP_TITLE, stageId, container, index }), [dispatch]);

  return {
    pendingDelete,
    confirmDelete: () => { pendingDelete?.run(); setPendingDelete(null); },
    cancelDelete: () => setPendingDelete(null),
    onUpdateStage, onRemoveStage, onAddStage, onMoveStage, onSetStart, onCommitStageTitle, onSetDeadline,
    onAddTransition, onUpdateTransition, onRemoveTransition, onMoveTransition, onSetCatchAll,
    onAddStep, onUpdateStep, onRemoveStep, onMoveStep, onCommitStepTitle,
  };
}
