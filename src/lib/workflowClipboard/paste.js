/**
 * Preparing a paste: new ids at every depth, links between pasted things pointed
 * at the new copies, links to things since deleted cleared the way deleting them would.
 */

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

/** The title a pasted top-level item gets — marked, so the two can be told apart. */
function copyTitle(title) {
  const trimmed = String(title ?? '').trim();
  return trimmed ? `${trimmed} (copy)` : '';
}

/**
 * Renames `<old>.outcome` fields in a condition, at any depth.
 *
 * Only exact `<id>.outcome` names are touched: a field that merely starts with a
 * step's id is some other field.
 */
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

/**
 * The shared engine for both kinds of paste.
 *
 * Two passes, on purpose. Every new id is decided first, across the whole paste,
 * and only then are links rewritten — a transition in the first pasted stage can
 * point at the third, and a condition can read an approval further down.
 */
function createPaster(state) {
  const graph = state.graph ?? { stages: [] };
  const taken = collectIds(graph);
  const existingStages = new Set((graph.stages ?? []).map((s) => s.id));

  // Names a query may not write into: every list already being written, every
  // declared variable, and the engine's own `targets`. Two queries sharing a
  // name would share one list.
  const takenLists = new Set(declaredVariableNames(state));
  takenLists.add(PICKED_TARGETS_LIST);
  eachStep(graph, (step) => {
    if (step.type === STEP_TYPE.QUERY && step.into) takenLists.add(step.into);
  });

  const stageIds = new Map();
  const stepIds = new Map();
  const listNames = new Map();
  let cleared = 0;

  // Where "Step N" numbering stands; it moves on with every step pasted.
  const numbering = stepNumbering(graph);

  /**
   * A pasted step's title.
   *
   * Still a default "Step 3"? The next number, at any depth — the same as Add
   * step, and the same as a pasted "Stage 2". Otherwise a selected step is
   * marked " (copy)", and a step inside a copied block keeps its name.
   */
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

  /** Pass one for steps: new ids (and new list names) at every depth. */
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
      // Branch ids only have to be unique within their own parallel step, so a
      // copy of the whole step keeps them.
      if (step.branches) next.branches = step.branches.map((b) => ({ ...b, steps: renameSteps(b.steps, false) }));
      return next;
    });

  /**
   * A stage id as the pasted copy should see it: the pasted copy of that stage,
   * the original if it is still there, or null when it has gone.
   */
  const stageTarget = (id) => {
    if (id == null) return { id: null, gone: false };
    if (stageIds.has(id)) return { id: stageIds.get(id), gone: false };
    if (existingStages.has(id)) return { id, gone: false };
    return { id: null, gone: true };
  };

  /** Pass two for steps: links. */
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

      // A Send notification about a task that was copied with it follows the
      // copy; one about a task left behind keeps pointing at the original.
      if (step.taskStepId && stepIds.has(step.taskStepId)) {
        next.taskStepId = stepIds.get(step.taskStepId);
      }

      if (step.overdue?.toStageId != null) {
        const target = stageTarget(step.overdue.toStageId);
        if (target.gone) {
          // The same as deleting that stage: the escalation is removed.
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
 * Stages from the clipboard, ready to insert.
 *
 * A pasted stage called "Stage 2" becomes the next number rather than
 * "Stage 2 (copy)" — the same numbering Add stage uses. Any other title gets
 * " (copy)", because two stages with one name make every "go to" list ambiguous.
 *
 * @returns {{ stages: Array, cleared: number }} `cleared` counts links that
 *   pointed at a stage deleted since the copy, and were cleared.
 */
export function prepareStagePaste(state, items) {
  const paster = createPaster(state);
  const titled = [...(state.graph?.stages ?? [])];

  // Pass one: ids for the stages and everything in them.
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
      // A transition to a stage that has gone ends the run — what deleting it does.
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
 * Steps from the clipboard, ready to insert into one list.
 *
 * @param {Object} state
 * @param {Array} items the copied steps
 * @param {{ insideParallelBranch?: boolean }} target
 * @returns {{ steps: Array, cleared: number, refused: string[] }} a non-empty
 *   `refused` means nothing may be pasted there, and `steps` is empty.
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
