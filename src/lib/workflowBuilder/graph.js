import { isEmptyGroup } from '@/lib/filterDescription';

export function catchAllAt(transitions = []) {
  return transitions.findIndex((t) => isEmptyGroup(t.condition));
}

export function collectIds(graph) {
  const ids = new Set();

  const walkSteps = (steps) => {
    for (const step of steps ?? []) {
      if (step?.id) ids.add(step.id);
      walkSteps(step?.whenTrue);
      walkSteps(step?.whenFalse);
      walkSteps(step?.body);
      for (const branch of step?.branches ?? []) walkSteps(branch?.steps);
    }
  };

  for (const stage of graph?.stages ?? []) {
    if (stage?.id) ids.add(stage.id);
    walkSteps(stage.steps);
  }

  return ids;
}

export function eachStep(graph, visit) {
  const walk = (steps, stage) => {
    for (const step of steps ?? []) {
      visit(step, stage);
      walk(step.whenTrue, stage);
      walk(step.whenFalse, stage);
      walk(step.body, stage);
      for (const branch of step.branches ?? []) walk(branch.steps, stage);
    }
  };
  for (const stage of graph?.stages ?? []) walk(stage.steps, stage);
}

/**
 * @param {Object} stage
 * @param {Array} container
 * @returns {Array}
 */
export function getStepContainer(stage, container = []) {
  let list = stage.steps ?? [];

  for (const hop of container) {
    const step = list[hop.index];
    if (!step) return [];
    list =
      hop.list === 'branches'
        ? step.branches?.[hop.branchIndex]?.steps ?? []
        : step[hop.list] ?? [];
  }

  return list;
}

export function setStepContainer(stage, container, nextList) {
  const rec = (list, depth) => {
    if (depth === container.length) return nextList;

    const hop = container[depth];
    const step = list[hop.index];
    if (!step) return list;

    const childList =
      hop.list === 'branches'
        ? step.branches?.[hop.branchIndex]?.steps ?? []
        : step[hop.list] ?? [];

    const updatedChild = rec(childList, depth + 1);

    const updatedStep =
      hop.list === 'branches'
        ? {
            ...step,
            branches: (step.branches ?? []).map((b, i) =>
              i === hop.branchIndex ? { ...b, steps: updatedChild } : b
            ),
          }
        : { ...step, [hop.list]: updatedChild };

    return list.map((s, i) => (i === hop.index ? updatedStep : s));
  };

  return { ...stage, steps: rec(stage.steps ?? [], 0) };
}
