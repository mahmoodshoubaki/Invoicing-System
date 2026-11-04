import { eachStep } from '@/lib/workflowBuilderState';

export function childLists(step) {
  return [step?.whenTrue, step?.whenFalse, step?.body, ...(step?.branches ?? []).map((b) => b.steps)];
}

/**
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

export function stageOfStep(graph, stepId) {
  const at = locateStep(graph, stepId);
  return at ? (graph.stages ?? []).find((s) => s.id === at.stageId) ?? null : null;
}

export function findStep(graph, id) {
  let found = null;
  eachStep(graph, (step) => {
    if (!found && step.id === id) found = step;
  });
  return found;
}
