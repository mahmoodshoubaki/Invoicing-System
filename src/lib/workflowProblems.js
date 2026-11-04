const NO_MESSAGES = [];

/**
 * @param {Array<{ area: string, stageId: string|null, stepId: string|null, message: string }>} problems
 * @returns {{ all: Array, byStep: Map<string, string[]>, byStage: Map<string, string[]> }}
 */
export function indexProblems(problems) {
  const byStep = new Map();
  const byStage = new Map();
  const add = (map, key, message) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(message);
  };

  for (const p of problems ?? []) {
    if (p.area === 'step') add(byStep, p.stepId, p.message);
    else if (p.area === 'stage' || p.area === 'transition') add(byStage, p.stageId, p.message);
  }
  return { all: problems ?? [], byStep, byStage };
}

export function stepProblems(index, stepId) {
  return index?.byStep.get(stepId) ?? NO_MESSAGES;
}

export function stageProblems(index, stageId) {
  return index?.byStage.get(stageId) ?? NO_MESSAGES;
}

/**
 * @returns {{ kind: 'step'|'stage', id: string } | { kind: 'workflow', tab: string }}
 */
export function problemTarget(problem) {
  if (problem.area === 'step' && problem.stepId) return { kind: 'step', id: problem.stepId };
  if ((problem.area === 'stage' || problem.area === 'transition') && problem.stageId) {
    return { kind: 'stage', id: problem.stageId };
  }
  if (problem.area === 'variable') return { kind: 'workflow', tab: 'variables' };
  return { kind: 'workflow', tab: 'settings' };
}
