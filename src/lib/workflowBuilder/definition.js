import { TARGET_TYPE, TRIGGER_KIND } from '@/constants/workflow';
import { createStage } from '@/models/workflow';

import { eachStep } from './graph';

/**
 * @param {Array<{title?: string}>} stages
 */
export function nextStageTitle(stages = []) {
  let highest = stages.length;
  for (const stage of stages) {
    const match = /^stage\s+(\d+)$/i.exec(String(stage?.title ?? '').trim());
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return `Stage ${highest + 1}`;
}

export const DEFAULT_STEP_TITLE = /^step\s+(\d+)$/i;

export function stepNumbering(graph) {
  let count = 0;
  let highest = 0;
  eachStep(graph, (step) => {
    count += 1;
    const match = DEFAULT_STEP_TITLE.exec(String(step?.title ?? '').trim());
    if (match) highest = Math.max(highest, Number(match[1]));
  });
  return { count, highest };
}

export function nextStepTitle(graph) {
  const { count, highest } = stepNumbering(graph);
  return `Step ${Math.max(count, highest) + 1}`;
}

export function emptyDefinition() {
  const first = createStage({ id: 'stage-1', title: nextStageTitle([]), transitions: [] });

  return withBaseline({
    id: null,
    code: null,
    version: null,
    isActive: false,
    // Nothing saved yet: no draft, so a first save sends no stamp.
    isDraft: false,
    stamp: null,
    name: '',
    description: '',
    targetTypeKey: TARGET_TYPE.NONE,
    trigger: { kind: TRIGGER_KIND.MANUAL, inputs: [] },
    variables: [],
    graph: { startStageId: first.id, stages: [first] },
  });
}

export function fromDefinition(definition) {
  if (!definition) return emptyDefinition();

  return withBaseline({
    id: definition.id ?? null,
    code: definition.code ?? null,
    version: definition.version ?? null,
    isActive: definition.isActive === true,
    isDraft: definition.isDraft === true,
    stamp: definition.stamp ?? null,
    name: definition.name ?? '',
    description: definition.description ?? '',
    targetTypeKey: definition.targetTypeKey ?? TARGET_TYPE.NONE,
    trigger: definition.trigger ?? { kind: TRIGGER_KIND.MANUAL, inputs: [] },
    variables: definition.variables ?? [],
    graph: definition.graph ?? { startStageId: null, stages: [] },
  });
}

export function editableSnapshot(state) {
  return JSON.stringify({
    name: state.name,
    description: state.description,
    targetTypeKey: state.targetTypeKey,
    trigger: state.trigger,
    variables: state.variables,
    graph: state.graph,
  });
}

export function withBaseline(state) {
  return { ...state, baseline: editableSnapshot(state), removedAssignees: [] };
}

export function isDirty(state) {
  return editableSnapshot(state) !== state.baseline;
}
