'use client';

import { useMemo } from 'react';

import { STEP_TYPE } from '@/constants/workflow';
import { availableLists, declaredVariableNames, eachStep } from '@/lib/workflowBuilderState';
import { CLIP_KIND } from '@/lib/workflowClipboard';

/** Stable identity for "no steps selected", which every StepCard reads. */
const NO_IDS = new Set();

/**
 * Everything the step tree needs, bundled.
 *
 * Steps nest arbitrarily, so passing these individually would mean threading
 * a dozen props through every level. Memoised because it lands on memoised
 * components — a fresh object each render would defeat all of them.
 *
 * @param {{
 *   state: Object,
 *   lookups: { roles, rolesLoading, resolvedById, actions, approvedHosts },
 *   catalogs: ReturnType<import('./useBuilderCatalogs').useBuilderCatalogs>,
 *   editing: ReturnType<import('./useBuilderEditing').useBuilderEditing>,
 *   clip: ReturnType<import('./useBuilderClipboard').useBuilderClipboard>,
 *   notificationTypes: Array|null,
 *   canvas: ReturnType<import('./useCanvasActions').useCanvasActions>,
 *   serverProblems: ReturnType<import('@/lib/workflowProblems').indexProblems>|null,
 * }} options
 */
export function useStepTreeContext({ state, lookups, catalogs, editing, clip, notificationTypes, canvas, serverProblems }) {
  const { roles, rolesLoading, resolvedById, actions, approvedHosts } = lookups;
  const { fields, fieldsByTargetType, declaredVariables, taskFields } = catalogs;
  const { onUpdateStep, onRemoveStep, onMoveStep, onCommitStepTitle } = editing;
  const { selection, onSelect, clipboard, pasteSteps, stepClipBranchProblem, clipLabel, clipVerb, isCut, cutIds } = clip;

  /** Every human task in the workflow, at any depth — what a Send notification can be about. */
  const humanTaskSteps = useMemo(() => {
    const found = [];
    eachStep(state.graph, (step) => {
      if (step.type === STEP_TYPE.HUMAN_TASK && step.id) found.push({ id: step.id, title: step.title });
    });
    return found;
  }, [state.graph]);

  return useMemo(
    () => ({
      roles, rolesLoading, resolvedById, actions, approvedHosts, fields,
      stages: state.graph.stages,
      lists: availableLists(state),
      // A For-each editor needs the row shape of the list it walks, which is
      // GetFields for that query's target type — not necessarily the
      // workflow's own.
      fieldsByTargetType,
      // The tracked record's whole field list, for a task's Fields tab (2026-10-13).
      taskFields,
      // What a setVariable step may write to. The names are matched
      // case-sensitively server-side, so the editor picks from this rather than
      // letting one be typed.
      declaredVariables,
      declaredNames: declaredVariableNames(state),
      // Adding a step also opens it in the side panel, where its settings are.
      onAddStep: canvas.addStep,
      onUpdateStep, onRemoveStep, onMoveStep, onCommitStepTitle,
      // Opening a card in the side panel, its menu, and which one is open.
      canvas,
      // The server's problems with the saved draft, by step and stage — null
      // while unknown or out of date, and then the builder's own checks show.
      serverProblems,
      // Lets a step editor check its escalation target without reporting every
      // one as dangling for want of the stage list.
      stageIds: new Set(state.graph.stages.map((s) => s.id)),
      // Copy, cut and paste. A list shows its Paste / Move button only while
      // steps are on the clipboard.
      selectedStepIds: selection.kind === CLIP_KIND.STEP ? new Set(selection.ids) : NO_IDS,
      onSelect,
      stepClipLabel: clipboard?.kind === CLIP_KIND.STEP ? clipLabel : null,
      stepClipVerb: clipVerb,
      stepClipIsCut: clipboard?.kind === CLIP_KIND.STEP && isCut,
      cutStepIds: clipboard?.kind === CLIP_KIND.STEP ? cutIds : NO_IDS,
      stepClipBranchProblem,
      onPasteSteps: pasteSteps,
      // Notifications (2026-10-07): the type list for every type dropdown, and
      // the workflow's human tasks a Send notification step may be about.
      notificationTypes,
      notificationTypeKeys: notificationTypes ? new Set(notificationTypes.map((t) => t.key)) : null,
      humanTaskSteps,
      humanTaskIds: new Set(humanTaskSteps.map((t) => t.id)),
    }),
    [roles, rolesLoading, resolvedById, actions, approvedHosts, fields, state, fieldsByTargetType, declaredVariables, taskFields,
      canvas, onUpdateStep, onRemoveStep, onMoveStep, onCommitStepTitle, selection, onSelect, clipboard, pasteSteps,
      stepClipBranchProblem, clipLabel, clipVerb, isCut, cutIds, notificationTypes, humanTaskSteps, serverProblems]
  );
}
