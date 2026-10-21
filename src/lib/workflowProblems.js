/**
 * The server's problems with a draft (2026-10-11), placed where they belong.
 *
 * SaveDefinition lists every problem with an `area` and the ids that locate it;
 * a publish refused with WF-053 lists the same. While the draft on screen is the
 * one they were found in (saved, nothing edited since), they are what blocks a
 * publish — and each is drawn on the card it is about, and opens it on click.
 */

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
    // A stage's own problems and its transitions' — both are edited in its panel.
    else if (p.area === 'stage' || p.area === 'transition') add(byStage, p.stageId, p.message);
  }
  return { all: problems ?? [], byStep, byStage };
}

/** One step's problems from an index, or the shared empty list. */
export function stepProblems(index, stepId) {
  return index?.byStep.get(stepId) ?? NO_MESSAGES;
}

/** One stage's problems (its own and its transitions') from an index. */
export function stageProblems(index, stageId) {
  return index?.byStage.get(stageId) ?? NO_MESSAGES;
}

/**
 * Where clicking a problem should take the author.
 *
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
