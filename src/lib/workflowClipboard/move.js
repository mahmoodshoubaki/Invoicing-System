import { BuilderActions, builderReducer, eachStep } from '@/lib/workflowBuilderState';

import { refusedInBranch } from './branchRule';
import { CLIP_KIND } from './kinds';
import { joinNames, orderedSelection } from './selection';
import { childLists } from './tree';

const MARKER_ID = '__moving-here__';

function fillMarker(steps, items) {
  return (steps ?? []).flatMap((step) => {
    if (step.id === MARKER_ID) return items;
    const next = { ...step };
    if (step.whenTrue) next.whenTrue = fillMarker(step.whenTrue, items);
    if (step.whenFalse) next.whenFalse = fillMarker(step.whenFalse, items);
    if (step.body) next.body = fillMarker(step.body, items);
    if (step.branches) next.branches = step.branches.map((b) => ({ ...b, steps: fillMarker(b.steps, items) }));
    return [next];
  });
}

function removeSteps(steps, ids) {
  return (steps ?? []).filter((step) => !ids.has(step.id)).map((step) => {
    const next = { ...step };
    if (step.whenTrue) next.whenTrue = removeSteps(step.whenTrue, ids);
    if (step.whenFalse) next.whenFalse = removeSteps(step.whenFalse, ids);
    if (step.body) next.body = removeSteps(step.body, ids);
    if (step.branches) next.branches = step.branches.map((b) => ({ ...b, steps: removeSteps(b.steps, ids) }));
    return next;
  });
}

function holdsMarker(steps) {
  return (steps ?? []).some((step) => step.id === MARKER_ID || childLists(step).some((list) => holdsMarker(list)));
}

/**
 * @param {Object} graph
 * @param {string[]} ids
 * @param {number} index
 * @returns {{ graph: Object, moved: string[] }}
 */
export function moveStages(graph, ids, index) {
  const items = orderedSelection(graph, CLIP_KIND.STAGE, ids);
  if (items.length === 0) return { graph, moved: [] };

  const marked = [...(graph.stages ?? [])];
  marked.splice(Math.min(Math.max(index, 0), marked.length), 0, { id: MARKER_ID });

  const movedIds = new Set(items.map((s) => s.id));
  const stages = marked
    .filter((s) => !movedIds.has(s.id))
    .flatMap((s) => (s.id === MARKER_ID ? items : [s]));

  return { graph: { ...graph, stages }, moved: items.map((s) => s.id) };
}

/**
 * @param {Object} graph
 * @param {string[]} ids
 * @param {{ stageId: string, container: Array, index: number, insideParallelBranch?: boolean }} target
 * @returns {{ graph: Object, moved: string[], refused: string|null }}
 */
export function moveSteps(graph, ids, target) {
  const items = orderedSelection(graph, CLIP_KIND.STEP, ids);
  if (items.length === 0) return { graph, moved: [], refused: null };

  if (target.insideParallelBranch) {
    const refused = refusedInBranch(items);
    if (refused.length > 0) {
      return { graph, moved: [], refused: `${joinNames(refused)} cannot run inside a parallel branch.` };
    }
  }

  const marked = builderReducer({ graph }, {
    type: BuilderActions.INSERT_STEPS,
    stageId: target.stageId,
    container: target.container,
    index: target.index,
    steps: [{ id: MARKER_ID }],
  }).graph;
  if (!(marked.stages ?? []).some((stage) => holdsMarker(stage.steps))) {
    return { graph, moved: [], refused: 'That place no longer exists.' };
  }

  const movedIds = new Set(items.map((s) => s.id));
  const intoItself = [];
  eachStep(marked, (step) => {
    if (movedIds.has(step.id) && childLists(step).some((list) => holdsMarker(list))) {
      intoItself.push(`"${step.title || step.id}"`);
    }
  });
  if (intoItself.length > 0) {
    return { graph, moved: [], refused: `${joinNames(intoItself)} cannot be moved inside itself.` };
  }

  const stages = marked.stages.map((stage) => ({
    ...stage,
    steps: fillMarker(removeSteps(stage.steps, movedIds), items),
  }));

  return { graph: { ...graph, stages }, moved: items.map((s) => s.id), refused: null };
}
