import { OUTCOME_FIELD_SUFFIX, PICKED_TARGETS_LIST, STEP_TYPE } from '@/constants/workflow';
import {
  collectIds,
  declaredVariableNames,
  DEFAULT_STEP_TITLE,
  eachStep,
  nextStageTitle,
  stepNumbering,
  uniqueVariableName,
  variableNameFrom,
} from '@/lib/workflowBuilderState';
import { uniqueSlug } from '@/utils/slug';

import { refusedInBranch } from './branchRule';

const DEFAULT_STAGE_TITLE = /^stage\s+\d+$/i;

function copyTitle(title) {
  const trimmed = String(title ?? '').trim();
  return trimmed ? `${trimmed} (copy)` : '';
}

function remapGroup(group, stepIds) {
  if (!group || stepIds.size === 0) return group;
  return {
    ...group,
    conditions: (group.conditions ?? []).map((c) => {
      if (typeof c.field !== 'string' || !c.field.endsWith(OUTCOME_FIELD_SUFFIX)) return c;
      const next = stepIds.get(c.field.slice(0, -OUTCOME_FIELD_SUFFIX.length));
      return next ? { ...c, field: `${next}${OUTCOME_FIELD_SUFFIX}` } : c;
    }),
    groups: (group.groups ?? []).map((g) => remapGroup(g, stepIds)),
  };
}

function createPaster(state) {
  const graph = state.graph ?? { stages: [] };
  const taken = collectIds(graph);
  const existingStages = new Set((graph.stages ?? []).map((s) => s.id));

  const takenLists = new Set(declaredVariableNames(state));
  takenLists.add(PICKED_TARGETS_LIST);
  eachStep(graph, (step) => {
    if (step.type === STEP_TYPE.QUERY && step.into) takenLists.add(step.into);
  });

  const stageIds = new Map();
  const stepIds = new Map();
  const listNames = new Map();
  let cleared = 0;

  const numbering = stepNumbering(graph);

  const pastedTitle = (step, topLevel) => {
    const raw = String(step.title ?? '').trim();
    let title = step.title;
    if (DEFAULT_STEP_TITLE.test(raw)) {
      const n = Math.max(numbering.count, numbering.highest) + 1;
      numbering.highest = n;
      title = `Step ${n}`;
    } else if (topLevel) {
      title = copyTitle(raw) || step.title;
    }
    numbering.count += 1;
    return title;
  };

  const renameSteps = (steps, topLevel) =>
    (steps ?? []).map((step) => {
      // Spread first so every key keeps its place — `type` stays first.
      const next = { ...step };
      next.title = pastedTitle(step, topLevel);

      const id = uniqueSlug(next.title || step.type, taken, 'step');
      taken.add(id);
      if (step.id) stepIds.set(step.id, id);
      next.id = id;

      if (step.type === STEP_TYPE.QUERY) {
        const into = uniqueVariableName(variableNameFrom(next.title ?? '') || 'results', takenLists);
        takenLists.add(into);
        if (step.into) listNames.set(step.into, into);
        next.into = into;
      }

      if (step.whenTrue) next.whenTrue = renameSteps(step.whenTrue, false);
      if (step.whenFalse) next.whenFalse = renameSteps(step.whenFalse, false);
      if (step.body) next.body = renameSteps(step.body, false);
      if (step.branches) next.branches = step.branches.map((b) => ({ ...b, steps: renameSteps(b.steps, false) }));
      return next;
    });

  const stageTarget = (id) => {
    if (id == null) return { id: null, gone: false };
    if (stageIds.has(id)) return { id: stageIds.get(id), gone: false };
    if (existingStages.has(id)) return { id, gone: false };
    return { id: null, gone: true };
  };

  const relinkSteps = (steps) =>
    (steps ?? []).map((step) => {
      const next = { ...step };

      if (step.condition) next.condition = remapGroup(step.condition, stepIds);
      if (step.until) next.until = remapGroup(step.until, stepIds);
      if (step.joinWhen) next.joinWhen = remapGroup(step.joinWhen, stepIds);
      if (step.filter) next.filter = remapGroup(step.filter, stepIds);

      if (step.type === STEP_TYPE.FOR_EACH && listNames.has(step.source)) {
        next.source = listNames.get(step.source);
      }

      if (step.taskStepId && stepIds.has(step.taskStepId)) {
        next.taskStepId = stepIds.get(step.taskStepId);
      }

      if (step.overdue?.toStageId != null) {
        const target = stageTarget(step.overdue.toStageId);
        if (target.gone) {
          delete next.overdue;
          cleared += 1;
        } else {
          next.overdue = { ...step.overdue, toStageId: target.id };
        }
      }

      if (step.whenTrue) next.whenTrue = relinkSteps(step.whenTrue);
      if (step.whenFalse) next.whenFalse = relinkSteps(step.whenFalse);
      if (step.body) next.body = relinkSteps(step.body);
      if (step.branches) next.branches = step.branches.map((b) => ({ ...b, steps: relinkSteps(b.steps) }));
      return next;
    });

  return {
    renameSteps,
    relinkSteps,
    stageTarget,
    taken,
    stageIds,
    stepIds,
    countCleared: () => { cleared += 1; },
    cleared: () => cleared,
  };
}

/**
 * @returns {{ stages: Array, cleared: number }}
 */
export function prepareStagePaste(state, items) {
  const paster = createPaster(state);
  const titled = [...(state.graph?.stages ?? [])];

  const renamed = (items ?? []).map((stage) => {
    const raw = String(stage.title ?? '').trim();
    const title = !raw || DEFAULT_STAGE_TITLE.test(raw) ? nextStageTitle(titled) : copyTitle(raw);
    titled.push({ title });

    const id = uniqueSlug(title, paster.taken, 'stage');
    paster.taken.add(id);
    paster.stageIds.set(stage.id, id);

    return { ...stage, id, title, steps: paster.renameSteps(stage.steps, false) };
  });

  // Pass two: links.
  const stages = renamed.map((stage) => {
    const next = { ...stage, steps: paster.relinkSteps(stage.steps) };

    next.transitions = (stage.transitions ?? []).map((t) => {
      const target = paster.stageTarget(t.toStageId);
      if (target.gone) paster.countCleared();
      return { ...t, condition: remapGroup(t.condition, paster.stepIds), toStageId: target.id };
    });

    if (stage.deadline) {
      const target = paster.stageTarget(stage.deadline.toStageId);
      if (target.gone) paster.countCleared();
      // Left pointing nowhere, which the builder reports: a deadline has to go somewhere.
      next.deadline = { ...stage.deadline, toStageId: target.id };
    }

    return next;
  });

  return { stages, cleared: paster.cleared() };
}

/**
 * @param {Object} state
 * @param {Array} items
 * @param {{ insideParallelBranch?: boolean }} target
 * @returns {{ steps: Array, cleared: number, refused: string[] }}
 */
export function prepareStepPaste(state, items, { insideParallelBranch = false } = {}) {
  if (insideParallelBranch) {
    const refused = refusedInBranch(items);
    if (refused.length > 0) return { steps: [], cleared: 0, refused };
  }

  const paster = createPaster(state);
  const renamed = paster.renameSteps(items, true);
  const steps = paster.relinkSteps(renamed);
  return { steps, cleared: paster.cleared(), refused: [] };
}
