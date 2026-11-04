'use client';

import { useMemo } from 'react';

import { STEP_TYPE } from '@/constants/workflow';
import { availableLists, declaredVariableNames, eachStep } from '@/lib/workflowBuilderState';
import { CLIP_KIND } from '@/lib/workflowClipboard';

const NO_IDS = new Set();

/**
 * @param {{ state: Object, lookups: { roles, rolesLoading, groups, groupsLoading, resolvedById, actions, approvedHosts }, catalogs: ReturnType<import('./useBuilderCatalogs').useBuilderCatalogs>, editing: ReturnType<import('./useBuilderEditing').useBuilderEditing>, clip: ReturnType<import('./useBuilderClipboard').useBuilderClipboard>, notificationTypes: Array|null, canvas: ReturnType<import('./useCanvasActions').useCanvasActions>, serverProblems: ReturnType<import('@/lib/workflowProblems').indexProblems>|null, }} options
 */
export function useStepTreeContext({ state, lookups, catalogs, editing, clip, notificationTypes, canvas, serverProblems }) {
  const { roles, rolesLoading, groups, groupsLoading, resolvedById, actions, approvedHosts } = lookups;
  const { fields, fieldsByTargetType, declaredVariables, taskFields } = catalogs;
  const { onUpdateStep, onRemoveStep, onMoveStep, onCommitStepTitle } = editing;
  const { selection, onSelect, clipboard, pasteSteps, stepClipBranchProblem, clipLabel, clipVerb, isCut, cutIds } = clip;

  const humanTaskSteps = useMemo(() => {
    const found = [];
    eachStep(state.graph, (step) => {
      if (step.type === STEP_TYPE.HUMAN_TASK && step.id) found.push({ id: step.id, title: step.title });
    });
    return found;
  }, [state.graph]);

  return useMemo(
    () => ({
      roles, rolesLoading, groups, groupsLoading, resolvedById, actions, approvedHosts, fields,
      stages: state.graph.stages,
      lists: availableLists(state),
      fieldsByTargetType,
      taskFields,
      declaredVariables,
      declaredNames: declaredVariableNames(state),
      onAddStep: canvas.addStep,
      onUpdateStep, onRemoveStep, onMoveStep, onCommitStepTitle,
      // Opening a card in the side panel, its menu, and which one is open.
      canvas,
      serverProblems,
      stageIds: new Set(state.graph.stages.map((s) => s.id)),
      selectedStepIds: selection.kind === CLIP_KIND.STEP ? new Set(selection.ids) : NO_IDS,
      onSelect,
      stepClipLabel: clipboard?.kind === CLIP_KIND.STEP ? clipLabel : null,
      stepClipVerb: clipVerb,
      stepClipIsCut: clipboard?.kind === CLIP_KIND.STEP && isCut,
      cutStepIds: clipboard?.kind === CLIP_KIND.STEP ? cutIds : NO_IDS,
      stepClipBranchProblem,
      onPasteSteps: pasteSteps,
      notificationTypes,
      notificationTypeKeys: notificationTypes ? new Set(notificationTypes.map((t) => t.key)) : null,
      humanTaskSteps,
      humanTaskIds: new Set(humanTaskSteps.map((t) => t.id)),
    }),
    [roles, rolesLoading, groups, groupsLoading, resolvedById, actions, approvedHosts, fields, state, fieldsByTargetType, declaredVariables, taskFields,
      canvas, onUpdateStep, onRemoveStep, onMoveStep, onCommitStepTitle, selection, onSelect, clipboard, pasteSteps,
      stepClipBranchProblem, clipLabel, clipVerb, isCut, cutIds, notificationTypes, humanTaskSteps, serverProblems]
  );
}
