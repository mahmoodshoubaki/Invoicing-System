/** Finding a step in the tree: where it sits, which stage holds it, the lists it holds. */

import { eachStep } from '@/lib/workflowBuilderState';

/** The lists a step holds other steps in: both arms, a loop body, every branch. */
export function childLists(step) {
  return [step?.whenTrue, step?.whenFalse, step?.body, ...(step?.branches ?? []).map((b) => b.steps)];
}

/**
 * Where a step sits: its stage, the container path the reducer addresses lists
 * by (see `getStepContainer`), its index in that list, and whether that list is
 * inside a parallel branch at any depth.
 *
 * @returns {{stageId: string, container: Array, index: number, insideParallelBranch: boolean}|null}
 */
export function locateStep(graph, stepId) {
  const search = (steps, container, inBranch, stageId) => {
    for (let index = 0; index < (steps ?? []).length; index += 1) {
      const step = steps[index];
      if (step.id === stepId) return { stageId, container, index, insideParallelBranch: inBranch };

      for (const list of ['whenTrue', 'whenFalse', 'body']) {
        if (!step[list]) continue;
        const found = search(step[list], [...container, { index, list }], inBranch, stageId);
        if (found) return found;
      }
      for (let branchIndex = 0; branchIndex < (step.branches ?? []).length; branchIndex += 1) {
        const found = search(
          step.branches[branchIndex].steps,
          [...container, { index, list: 'branches', branchIndex }],
          true,
          stageId
        );
        if (found) return found;
      }
    }
    return null;
  };

  for (const stage of graph?.stages ?? []) {
    const found = search(stage.steps, [], false, stage.id);
    if (found) return found;
  }
  return null;
}

/** The stage a step lives in, at any depth. */
export function stageOfStep(graph, stepId) {
  const at = locateStep(graph, stepId);
  return at ? (graph.stages ?? []).find((s) => s.id === at.stageId) ?? null : null;
}

/** A step anywhere in the workflow, by id. */
export function findStep(graph, id) {
  let found = null;
  eachStep(graph, (step) => {
    if (!found && step.id === id) found = step;
  });
  return found;
}
