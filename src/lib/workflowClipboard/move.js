/**
 * Moving — a cut, pasted. The originals move, ids and all, so nothing pointing
 * at them breaks.
 */

import { BuilderActions, builderReducer, eachStep } from '@/lib/workflowBuilderState';

import { refusedInBranch } from './branchRule';
import { CLIP_KIND } from './kinds';
import { joinNames, orderedSelection } from './selection';
import { childLists } from './tree';

/**
 * Stands in for the moved things at the destination while the originals are
 * taken out.
 *
 * Positions are indexes — a step's place is "index 2 of the list inside the
 * step at index 0" — and taking the originals out first would shift them
 * whenever an original sat earlier in the same list or in a list above. So the
 * destination is marked BEFORE anything is removed, and filled in after.
 */
const MARKER_ID = '__moving-here__';

/** Replaces the marker in a step tree with `items`, at any depth. */
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

/** Takes the steps named in `ids` out of a step tree, at any depth. */
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

/** Whether the marker sits anywhere inside these steps. */
function holdsMarker(steps) {
  return (steps ?? []).some((step) => step.id === MARKER_ID || childLists(step).some((list) => holdsMarker(list)));
}

/**
 * Moves stages to `index` in the flow, keeping their ids.
 *
 * Nothing that points at a stage has to change: transitions, deadlines,
 * escalations and the start stage all name it by id, and the id goes with it.
 *
 * @param {Object} graph
 * @param {string[]} ids the stages that were cut
 * @param {number} index where the first lands, counted as the flow is NOW
 * @returns {{ graph: Object, moved: string[] }} `moved` empty means nothing that
 *   was cut still exists, and `graph` is the one passed in.
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
 * Moves steps into one list, keeping their ids — and everything inside them.
 *
 * Keeping ids is the point of cutting rather than copying: a condition reading
 * `approve.outcome` still reads the same step wherever it now stands.
 *
 * Refused, with nothing moved, when:
 *   - the destination is inside one of the steps being moved — a block cannot
 *     be put inside itself;
 *   - the destination is a parallel branch, and a delay or parallel step is
 *     among them — the same rule as pasting.
 *
 * @param {Object} graph
 * @param {string[]} ids the steps that were cut
 * @param {{ stageId: string, container: Array, index: number, insideParallelBranch?: boolean }} target
 *   counted as the workflow is NOW, originals still in place
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

  // Mark the destination with the reducer's own insert, so it is addressed
  // exactly the way a paste is.
  const marked = builderReducer({ graph }, {
    type: BuilderActions.INSERT_STEPS,
    stageId: target.stageId,
    container: target.container,
    index: target.index,
    steps: [{ id: MARKER_ID }],
  }).graph;
  // Checked by looking for the marker, not by identity: a stale path still
  // yields a new graph object, and moving on without the marker placed would
  // take the originals out and put them nowhere.
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
