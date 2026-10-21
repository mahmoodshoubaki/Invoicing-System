'use client';

import { useCallback, useMemo } from 'react';

import { useToast } from '@/hooks/useToast';
import { BuilderActions, getStepContainer } from '@/lib/workflowBuilderState';
import { CLIP_KIND, copyItems, joinNames, prepareStagePaste, prepareStepPaste } from '@/lib/workflowClipboard';
import { stageMenuItems, stepMenuItems, workflowMenuItems } from '@/components/workflow/builder/menu/cardMenus';
import { stepTabs } from '@/components/workflow/builder/stepTabs';

/** Whether a list sits inside a parallel branch, at any depth — from its path alone. */
const inBranch = (container) => (container ?? []).some((hop) => hop.list === 'branches');

/**
 * What the cards on the canvas can do beyond being looked at: open in the side
 * panel, and everything in their menus — Duplicate, Copy, Cut, Paste, Move,
 * Delete, Make it the start.
 *
 * Adding a stage or a step opens it in the panel straight away: its settings
 * live there now, so that is where its author is going next.
 *
 * @param {{
 *   state: Object, dispatch: Function,
 *   editing: ReturnType<import('./useBuilderEditing').useBuilderEditing>,
 *   clip: ReturnType<import('./useBuilderClipboard').useBuilderClipboard>,
 *   inspector: ReturnType<import('../inspector/useInspector').useInspector>,
 *   menu: ReturnType<import('../menu/useCardMenu').useCardMenu>,
 * }} options
 */
export function useCanvasActions({ state, dispatch, editing, clip, inspector, menu }) {
  const toast = useToast();
  // The hooks hand back fresh objects every render; their handlers are stable.
  // Depending on the handlers keeps every card on the canvas from redrawing.
  const { onAddStep, onAddStage, onMoveStep, onRemoveStep, onSetStart, onMoveStage, onRemoveStage } = editing;
  const { countFor, copyItem, cutItem, pasteSteps, pasteStages } = clip;
  const { open: openItem, openAt, showWorkflow, inspecting } = inspector;
  const openMenu = menu.open;

  // -------------------------------------------------------------------------- adding
  const addStep = useCallback((stageId, container, step) => {
    const stage = state.graph.stages.find((s) => s.id === stageId);
    const size = stage ? getStepContainer(stage, container).length : 0;
    onAddStep(stageId, container, step);
    // It lands at the end of its list; the reducer names it.
    openAt('step', {
      stageId, container, index: size, size: size + 1, type: step.type, insideParallelBranch: inBranch(container),
    });
  }, [onAddStep, openAt, state.graph.stages]);

  const addStage = useCallback(() => {
    const count = state.graph.stages.length;
    onAddStage();
    openAt('stage', { index: count, count: count + 1 });
  }, [onAddStage, openAt, state.graph.stages.length]);

  // -------------------------------------------------------------------------- duplicating
  /** A copy right below the original, with new ids — a paste that needs no clipboard. */
  const duplicateStep = useCallback((where) => {
    const stage = state.graph.stages.find((s) => s.id === where.stageId);
    const step = stage ? getStepContainer(stage, where.container)[where.index] : null;
    if (!step) return;

    const result = prepareStepPaste(state, copyItems([step]), { insideParallelBranch: where.insideParallelBranch });
    if (result.refused.length > 0) {
      toast.error('Not duplicated', `${joinNames(result.refused)} cannot run inside a parallel branch.`);
      return;
    }
    dispatch({
      type: BuilderActions.INSERT_STEPS,
      stageId: where.stageId,
      container: where.container,
      index: where.index + 1,
      steps: result.steps,
    });
  }, [dispatch, state, toast]);

  const duplicateStage = useCallback((index) => {
    const stage = state.graph.stages[index];
    if (!stage) return;
    const { stages } = prepareStagePaste(state, copyItems([stage]));
    dispatch({ type: BuilderActions.INSERT_STAGES, index: index + 1, stages });
  }, [dispatch, state]);

  // -------------------------------------------------------------------------- menus
  const { clipboard, clipVerb, clipLabel, stepClipBranchProblem, isCut } = clip;

  /**
   * @param {{x: number, y: number}|Element} from
   * @param {{ step: Object, where: Object, total: number, insideCut: boolean }} card
   */
  const openStepMenu = useCallback((from, { step, where, total, insideCut }) => {
    const pastingSteps = clipboard?.kind === CLIP_KIND.STEP;
    const blocked = !pastingSteps
      ? null
      : insideCut && isCut
        ? 'steps cannot be moved inside themselves.'
        : where.insideParallelBranch ? stepClipBranchProblem : null;

    const facts = {
      tabs: stepTabs(step.type),
      index: where.index,
      total,
      copyCount: countFor(CLIP_KIND.STEP, step.id),
      paste: pastingSteps ? { verb: clipVerb, label: clipLabel, blocked } : null,
    };
    const run = {
      open: (tab) => openItem('step', step.id, tab, { focus: true }),
      duplicate: () => duplicateStep(where),
      copy: () => copyItem(CLIP_KIND.STEP, step.id),
      cut: () => cutItem(CLIP_KIND.STEP, step.id),
      paste: () => pasteSteps({ ...where, index: where.index + 1 }),
      move: (delta) => onMoveStep(where.stageId, where.container, where.index, where.index + delta),
      remove: () => onRemoveStep(where.stageId, where.container, where.index),
    };
    openMenu(from, stepMenuItems(facts, run), `${step.title || 'Step'} — actions`);
  }, [clipLabel, clipVerb, clipboard, copyItem, countFor, cutItem, duplicateStep, isCut, onMoveStep, onRemoveStep, openItem, openMenu, pasteSteps, stepClipBranchProblem]);

  /**
   * @param {{x: number, y: number}|Element} from
   * @param {{ stage: Object, index: number, isStart: boolean }} card
   */
  const openStageMenu = useCallback((from, { stage, index, isStart }) => {
    const facts = {
      index,
      total: state.graph.stages.length,
      isStart,
      copyCount: countFor(CLIP_KIND.STAGE, stage.id),
      paste: clipboard?.kind === CLIP_KIND.STAGE ? { verb: clipVerb, label: clipLabel, blocked: null } : null,
      pasteSteps: clipboard?.kind === CLIP_KIND.STEP ? { verb: clipVerb, label: clipLabel, blocked: null } : null,
    };
    const run = {
      open: () => openItem('stage', stage.id, null, { focus: true }),
      setStart: () => onSetStart(stage.id),
      duplicate: () => duplicateStage(index),
      copy: () => copyItem(CLIP_KIND.STAGE, stage.id),
      cut: () => cutItem(CLIP_KIND.STAGE, stage.id),
      paste: () => pasteStages(index + 1),
      pasteSteps: () => pasteSteps({
        stageId: stage.id, container: [], index: (stage.steps ?? []).length, insideParallelBranch: false,
      }),
      move: (delta) => onMoveStage(index, index + delta),
      remove: () => onRemoveStage(stage.id),
    };
    openMenu(from, stageMenuItems(facts, run), `${stage.title || 'Stage'} — actions`);
  }, [clipLabel, clipVerb, clipboard, copyItem, countFor, cutItem, duplicateStage, onMoveStage, onRemoveStage, onSetStart, openItem, openMenu, pasteStages, pasteSteps, state.graph.stages.length]);

  const openWorkflowMenu = useCallback((from) => {
    openMenu(from, workflowMenuItems({ open: (tab) => showWorkflow(tab, { focus: true }) }), 'Workflow — actions');
  }, [openMenu, showWorkflow]);

  return useMemo(() => ({
    inspecting,
    inspect: openItem,
    showWorkflow,
    addStep,
    addStage,
    openStepMenu,
    openStageMenu,
    openWorkflowMenu,
  }), [addStage, addStep, inspecting, openItem, openStageMenu, openStepMenu, openWorkflowMenu, showWorkflow]);
}
