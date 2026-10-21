/**
 * Finding what the side panel has open, in the definition as it is NOW.
 *
 * The panel names a stage or step by id, but ids move: committing a title
 * re-derives the id from it, and undo can put the old one back. So the panel
 * also remembers WHERE its item last was (`at`), and when the id is no longer
 * found it looks there — accepting what it finds only if the list around it is
 * the same size and, for a step, of the same type. A rename passes that test;
 * a delete does not, and the panel closes instead of jumping to a neighbour.
 *
 * The same rule opens something just added: a new step has no id until the
 * reducer gives it one, so it is opened by position — the end of its list.
 *
 * Pure, so the rule can be tested without a screen.
 */

import { getStepContainer } from '@/lib/workflowBuilderState';
import { locateStep } from '@/lib/workflowClipboard';

/** The container steps a step sits inside, outermost first. */
function ancestorsAt(stage, container) {
  const found = [];
  let list = stage.steps ?? [];
  for (const hop of container) {
    const step = list[hop.index];
    if (!step) break;
    found.push(step);
    list = hop.list === 'branches' ? step.branches?.[hop.branchIndex]?.steps ?? [] : step[hop.list] ?? [];
  }
  return found;
}

function resolveStage(graph, target) {
  const stages = graph?.stages ?? [];
  let index = target.id ? stages.findIndex((s) => s.id === target.id) : -1;
  if (index === -1 && target.at && stages.length === target.at.count) index = target.at.index;

  const stage = stages[index];
  if (!stage) return null;
  return { kind: 'stage', id: stage.id, stage, index, at: { index, count: stages.length } };
}

function resolveStep(graph, target) {
  const stages = graph?.stages ?? [];
  let where = target.id ? locateStep(graph, target.id) : null;

  if (!where && target.at) {
    const { stageId, container, index, size, type, insideParallelBranch } = target.at;
    const stage = stages.find((s) => s.id === stageId);
    const list = stage ? getStepContainer(stage, container) : [];
    if (list.length === size && list[index]?.type === type) {
      where = { stageId, container, index, insideParallelBranch };
    }
  }
  if (!where) return null;

  const stage = stages.find((s) => s.id === where.stageId);
  const list = getStepContainer(stage, where.container);
  const step = list[where.index];
  if (!step) return null;

  return {
    kind: 'step',
    id: step.id,
    step,
    stageId: where.stageId,
    container: where.container,
    index: where.index,
    insideParallelBranch: where.insideParallelBranch,
    ancestors: ancestorsAt(stage, where.container),
    at: {
      stageId: where.stageId,
      container: where.container,
      index: where.index,
      size: list.length,
      type: step.type,
      insideParallelBranch: where.insideParallelBranch,
    },
  };
}

/**
 * @param {Object} graph
 * @param {{ kind: 'stage'|'step', id: string|null, at: Object|null }|null} target
 * @returns {Object|null} the item and where it is, or null when it is gone
 */
export function resolveTarget(graph, target) {
  if (!target) return null;
  return target.kind === 'stage' ? resolveStage(graph, target) : resolveStep(graph, target);
}

/** Whether two remembered positions are the same place. */
export function samePlace(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}
