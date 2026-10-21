import { isEmptyGroup } from '@/lib/filterDescription';

/**
 * Walking and addressing a definition's graph: every step at any depth, every
 * id, a stage's otherwise arm, and the list a step operation acts on.
 */

/**
 * Index of a stage's otherwise arm, or -1.
 *
 * A transition with an empty condition matches everything, so it is the
 * "otherwise" of an if / else-if chain. The builder keeps at most one and keeps
 * it last; this is the single place that recognises it, so the rule cannot
 * drift between the reducer, the validator and the screen.
 */
export function catchAllAt(transitions = []) {
  return transitions.findIndex((t) => isEmptyGroup(t.condition));
}

/**
 * Every id in the definition — stages and steps, at any depth.
 *
 * Steps nest: `branch` holds whenTrue/whenFalse, `forEach` and `repeat` hold a
 * body, `parallel` holds branches each holding steps. Uniqueness is required
 * across the whole definition, so this has to walk all of it rather than one
 * stage's top-level list.
 */
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

/** Walks every step in a definition, at any depth. */
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
 * Steps nest, so every step operation names the LIST it acts on rather than
 * assuming the stage's top level.
 *
 * A container is a path of hops from `stage.steps` inward. Each hop says
 * "descend into the step at `index`, then into its `list` child array":
 *
 *   []                                          → stage.steps
 *   [{ index: 2, list: 'whenTrue' }]            → stage.steps[2].whenTrue
 *   [{ index: 0, list: 'branches', branchIndex: 1 }]
 *                                               → stage.steps[0].branches[1].steps
 *
 * Stage 6 only ever passes `[]`. The nesting is here because `branch`,
 * `forEach`, `repeat` and `parallel` arrive in Stage 7, and retrofitting
 * addressing onto operations that assumed a flat list would mean rewriting
 * every one of them.
 *
 * @param {Object} stage
 * @param {Array} container
 * @returns {Array} the step list at that path
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

/** Returns a new stage with the list at `container` replaced. */
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
