'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useToast } from '@/hooks/useToast';
import { BuilderActions, eachStep } from '@/lib/workflowBuilderState';
import {
  CLIP_KIND,
  CLIP_MODE,
  NO_SELECTION,
  copyItems,
  describeClip,
  joinNames,
  moveStages,
  moveSteps,
  nextSelection,
  orderedSelection,
  pasteTargetFor,
  prepareStagePaste,
  prepareStepPaste,
  refusedInBranch,
} from '@/lib/workflowClipboard';
import { isTypingIn } from './keyboard';

/**
 * Selecting, copying, cutting and pasting stages and steps — and Ctrl+C / X / V
 * and Esc on the canvas.
 *
 * What is ticked and what was copied both belong to ONE workflow. The page
 * stays mounted when the author opens a different workflow, so plain state
 * would follow them there — each therefore remembers the workflow it was made
 * in (`workflowKey`), and simply does not show anywhere else. Neither is part
 * of the document, so neither is undone.
 *
 * @param {{ state: Object, workflowKey: string|null, dispatch: Function }} options
 */
export function useBuilderClipboard({ state, workflowKey, dispatch }) {
  const toast = useToast();
  const [selectionState, setSelection] = useState(NO_SELECTION);
  const [clipboardState, setClipboard] = useState(null);

  /**
   * What is ticked, as it stands now.
   *
   * Ids that no longer exist drop out — a deleted step, or one whose id
   * followed its title when it was renamed — so nothing can be copied that is
   * not on the screen.
   */
  const selection = useMemo(() => {
    if (selectionState.key !== workflowKey || selectionState.ids.length === 0) return NO_SELECTION;

    const live = new Set();
    if (selectionState.kind === CLIP_KIND.STAGE) {
      for (const stage of state.graph.stages) live.add(stage.id);
    } else {
      eachStep(state.graph, (step) => live.add(step.id));
    }

    const ids = selectionState.ids.filter((id) => live.has(id));
    return ids.length === 0 ? NO_SELECTION : { ...selectionState, ids };
  }, [selectionState, workflowKey, state.graph]);

  const clipboardInWorkflow = clipboardState?.key === workflowKey ? clipboardState : null;

  /**
   * What the clipboard holds, as of now.
   *
   * A copy is its snapshot. A cut is the originals still on the canvas — looked
   * up afresh, so edits made since the cut are what moves, and a cut whose
   * steps were all deleted since is no clipboard at all.
   */
  const clipItems = useMemo(() => {
    if (!clipboardInWorkflow) return [];
    if (clipboardInWorkflow.mode === CLIP_MODE.COPY) return clipboardInWorkflow.items;
    return orderedSelection(state.graph, clipboardInWorkflow.kind, clipboardInWorkflow.ids);
  }, [clipboardInWorkflow, state.graph]);

  const clipboard = clipItems.length > 0 ? clipboardInWorkflow : null;
  const isCut = clipboard?.mode === CLIP_MODE.CUT;
  const clipLabel = clipboard ? describeClip(clipboard.kind, clipItems.length) : '';
  // "Paste here" for a copy; "Move here" for a cut — they are different acts.
  const clipVerb = isCut ? 'Move' : 'Paste';

  /** Why the clipboard's steps can never go inside a parallel branch, or null. */
  const stepClipBranchProblem = useMemo(() => {
    if (clipboard?.kind !== CLIP_KIND.STEP) return null;
    const refused = refusedInBranch(clipItems);
    return refused.length > 0 ? `${joinNames(refused)} cannot run inside a parallel branch.` : null;
  }, [clipboard, clipItems]);

  /** The stages or steps waiting to be moved, drawn faded until they are. */
  const cutIds = useMemo(() => new Set(isCut ? clipItems.map((item) => item.id) : []), [isCut, clipItems]);

  /** Ticks or unticks one stage or step — see nextSelection. */
  const onSelect = useCallback((kind, id, { range = false, listIds = [] } = {}) => {
    setSelection((prev) => nextSelection(prev, kind, id, { key: workflowKey, range, listIds }));
  }, [workflowKey]);

  const clearSelection = useCallback(() => setSelection(NO_SELECTION), []);
  const cancelCut = useCallback(() => setClipboard(null), []);

  /**
   * A brand-new workflow only gets its code when first saved. It is still the
   * same workflow, so what was ticked and copied in it moves across rather than
   * vanishing.
   */
  const adoptCode = useCallback((savedCode) => {
    setSelection((s) => (s.key === null ? { ...s, key: savedCode } : s));
    setClipboard((c) => (c && c.key === null ? { ...c, key: savedCode } : c));
  }, []);

  /** What a Copy or Cut from one card takes: the whole selection if the card is in it, else the card alone. */
  const idsFor = useCallback(
    (kind, id) => (selection.kind === kind && selection.ids.includes(id) ? selection.ids : [id]),
    [selection]
  );

  /** How many that is — for the menu to say "Copy 3 steps". */
  const countFor = useCallback((kind, id) => idsFor(kind, id).length, [idsFor]);

  const copyGroup = useCallback((kind, ids) => {
    const items = orderedSelection(state.graph, kind, ids);
    if (items.length === 0) return;

    setClipboard({ key: workflowKey, kind, mode: CLIP_MODE.COPY, items: copyItems(items) });
    /*
     * The ticks are cleared once copied, so the next thing ticked is simply
     * where the paste goes. Left ticked, the originals competed with the
     * destination — and a destination above them lost.
     */
    setSelection(NO_SELECTION);
    const noun = kind === CLIP_KIND.STAGE ? 'stage' : 'step';
    toast.success(
      `Copied ${describeClip(kind, items.length)}`,
      `Right-click the ${noun} it goes under and choose Paste, or hover between ${noun}s and click Paste here.`
    );
  }, [state.graph, toast, workflowKey]);

  /**
   * Cut: nothing is removed yet. The originals stay where they are, faded,
   * until they are pasted somewhere — which is when they move. A cut that is
   * never pasted costs nothing, and Esc or Cancel takes it back.
   */
  const cutGroup = useCallback((kind, ids) => {
    const items = orderedSelection(state.graph, kind, ids);
    if (items.length === 0) return;

    setClipboard({ key: workflowKey, kind, mode: CLIP_MODE.CUT, ids: items.map((item) => item.id) });
    setSelection(NO_SELECTION);
    const noun = kind === CLIP_KIND.STAGE ? 'stage' : 'step';
    toast.success(
      `Cut ${describeClip(kind, items.length)}`,
      `Right-click the ${noun} ${items.length === 1 ? 'it goes' : 'they go'} under and choose Move, or hover between ${noun}s and click Move here. Nothing moves until then.`
    );
  }, [state.graph, toast, workflowKey]);

  /** The toolbar and Ctrl+C / Ctrl+X: whatever is ticked. */
  const handleCopy = useCallback(() => copyGroup(selection.kind, selection.ids), [copyGroup, selection]);
  const handleCut = useCallback(() => cutGroup(selection.kind, selection.ids), [cutGroup, selection]);

  /** A card's menu: that card, or the selection it is part of. */
  const copyItem = useCallback((kind, id) => copyGroup(kind, idsFor(kind, id)), [copyGroup, idsFor]);
  const cutItem = useCallback((kind, id) => cutGroup(kind, idsFor(kind, id)), [cutGroup, idsFor]);

  /** Links that pointed at a stage deleted since the copy — say so, never silently. */
  const reportCleared = useCallback((cleared) => {
    if (cleared === 0) return;
    toast.warning(
      'Pasted, but some links were cleared',
      `${cleared} link${cleared === 1 ? '' : 's'} pointed at a stage deleted since you copied, so ${cleared === 1 ? 'it was' : 'they were'} cleared the way deleting that stage clears them.`
    );
  }, [toast]);

  /**
   * After a paste or a move, nothing is left ticked (2026-10-11) — the ticks
   * were where it should go, and that job is done. A second Ctrl+V of steps
   * therefore needs a place picked again; stages go to the end of the flow.
   */
  const clearAfterPaste = useCallback(() => setSelection(NO_SELECTION), []);

  const pasteStages = useCallback((index) => {
    if (clipboard?.kind !== CLIP_KIND.STAGE) return;

    if (isCut) {
      const { graph } = moveStages(state.graph, clipboard.ids, index);
      dispatch({ type: BuilderActions.MOVE_ITEMS, graph });
      // A cut moves once. Pasting it again would move the same stages again.
      setClipboard(null);
      clearAfterPaste();
      return;
    }

    const { stages, cleared } = prepareStagePaste(state, clipboard.items);
    dispatch({ type: BuilderActions.INSERT_STAGES, index, stages });
    clearAfterPaste();
    reportCleared(cleared);
  }, [clearAfterPaste, clipboard, dispatch, isCut, reportCleared, state]);

  /**
   * @param {{ stageId: string, container: Array, index: number, insideParallelBranch: boolean }} target
   */
  const pasteSteps = useCallback((target) => {
    if (clipboard?.kind !== CLIP_KIND.STEP || !target) return;

    if (isCut) {
      const { graph, refused } = moveSteps(state.graph, clipboard.ids, target);
      if (refused) {
        toast.error('Nothing was moved', refused);
        return;
      }
      dispatch({ type: BuilderActions.MOVE_ITEMS, graph });
      setClipboard(null);
      clearAfterPaste();
      return;
    }

    const result = prepareStepPaste(state, clipboard.items, { insideParallelBranch: target.insideParallelBranch });
    if (result.refused.length > 0) {
      toast.error('Nothing was pasted', `${joinNames(result.refused)} cannot run inside a parallel branch.`);
      return;
    }

    dispatch({
      type: BuilderActions.INSERT_STEPS,
      stageId: target.stageId,
      container: target.container,
      index: target.index,
      steps: result.steps,
    });
    clearAfterPaste();
    reportCleared(result.cleared);
  }, [clearAfterPaste, clipboard, dispatch, isCut, reportCleared, state, toast]);

  // Where Ctrl+V and the toolbar's Paste put things — see pasteTargetFor.
  const pasteTarget = useMemo(
    () => pasteTargetFor(state.graph, clipboard?.kind ?? null, selection),
    [clipboard, selection, state.graph]
  );

  const handlePaste = useCallback(() => {
    if (!clipboard) return;
    if (clipboard.kind === CLIP_KIND.STAGE) {
      pasteStages(pasteTarget?.index ?? state.graph.stages.length);
      return;
    }
    if (!pasteTarget) {
      toast.info(
        isCut ? 'Choose where to move them' : 'Choose where to paste',
        `Select a step to ${isCut ? 'move them' : 'paste'} after it, or a stage to ${isCut ? 'move them' : 'paste'} to its end. Every step list also has its own ${clipVerb} button.`
      );
      return;
    }
    pasteSteps(pasteTarget);
  }, [clipVerb, clipboard, isCut, pasteStages, pasteSteps, pasteTarget, state.graph.stages.length, toast]);

  /*
   * Ctrl+C, Ctrl+X, Ctrl+V and Esc on the canvas.
   *
   * All of them step aside while a field has focus, the same way undo does.
   * Copy and cut also step aside when text on the page is highlighted: that
   * text is what the author means. Esc takes back one thing at a time — the
   * ticks first, then a cut.
   */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTypingIn(document.activeElement)) return;

      if (e.key === 'Escape') {
        if (selection.ids.length > 0) clearSelection();
        else if (isCut) cancelCut();
        return;
      }

      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
      const key = e.key.toLowerCase();

      if (key === 'c' || key === 'x') {
        if (selection.ids.length === 0 || window.getSelection()?.toString()) return;
        e.preventDefault();
        if (key === 'c') handleCopy();
        else handleCut();
      } else if (key === 'v') {
        if (!clipboard) return;
        e.preventDefault();
        handlePaste();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cancelCut, clearSelection, clipboard, handleCopy, handleCut, handlePaste, isCut, selection.ids.length]);

  return {
    selection, clipboard, isCut, clipLabel, clipVerb, stepClipBranchProblem, cutIds, pasteTarget,
    onSelect, clearSelection, cancelCut, adoptCode,
    handleCopy, handleCut, handlePaste, pasteStages, pasteSteps,
    countFor, copyItem, cutItem,
  };
}
