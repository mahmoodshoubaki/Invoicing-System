import { OUTCOME_FIELD_SUFFIX, PICKED_TARGETS_LIST, STEP_TYPE } from '@/constants/workflow';
import { slugify } from '@/utils/slug';

import { eachStep } from './graph';

/**
 * Ids and names are derived from titles and never shown, so renaming something
 * has to carry every reference to it — these do the carrying.
 */

/**
 * Rewrites every reference to `fromId` after a stage is renamed.
 *
 * A stage id is pointed at from three places, and missing any one of them
 * leaves a definition that saves cleanly and then dead-ends at runtime:
 * `graph.startStageId`, each transition's `toStageId`, and a stage deadline's
 * `toStageId`. `toStageId: null` is meaningful — it ends the run — so only
 * exact matches are touched.
 */
export function retargetStageId(graph, fromId, toId) {
  /**
   * A human task's `overdue.toStageId` is a fourth place a stage is pointed at,
   * and it is buried inside the step tree rather than on the stage. Missing it
   * would leave an escalation aimed at a stage that no longer exists — saved
   * happily, and discovered only when somebody failed to answer in time.
   */
  const retargetSteps = (steps) =>
    (steps ?? []).map((step) => {
      const next = { ...step };

      if (step.overdue?.toStageId === fromId) {
        next.overdue = toId === null ? undefined : { ...step.overdue, toStageId: toId };
      }

      if (step.whenTrue) next.whenTrue = retargetSteps(step.whenTrue);
      if (step.whenFalse) next.whenFalse = retargetSteps(step.whenFalse);
      if (step.body) next.body = retargetSteps(step.body);
      if (step.branches) next.branches = step.branches.map((b) => ({ ...b, steps: retargetSteps(b.steps) }));

      return next;
    });

  return {
    // Keeps everything else the graph carries — the run-level notifications.
    ...graph,
    startStageId: graph.startStageId === fromId ? toId : graph.startStageId,
    stages: graph.stages.map((stage) => ({
      ...stage,
      steps: retargetSteps(stage.steps),
      transitions: (stage.transitions ?? []).map((t) =>
        t.toStageId === fromId ? { ...t, toStageId: toId } : t
      ),
      ...(stage.deadline
        ? { deadline: stage.deadline.toStageId === fromId ? { ...stage.deadline, toStageId: toId } : stage.deadline }
        : {}),
    })),
  };
}

/**
 * A variable name from a human title: "Find overdue invoices" → "findOverdueInvoices".
 *
 * Variable names are referenced inside `{{placeholders}}` and by a `forEach`,
 * so they cannot carry hyphens the way a stage or step id does.
 */
export function variableNameFrom(title) {
  const parts = slugify(title).split('-').filter(Boolean);
  if (parts.length === 0) return '';
  return parts[0] + parts.slice(1).map((p) => p[0].toUpperCase() + p.slice(1)).join('');
}

/**
 * `name`, or `name2`, `name3`, … — whichever no other list is using.
 *
 * Two `query` steps writing the same name would fill ONE list, and retitling
 * either one would then rename the loops reading the other. Pasting makes
 * same-titled queries ordinary rather than rare, so names are kept apart here.
 *
 * @param {string} name empty stays empty
 * @param {Set<string>} taken
 */
export function uniqueVariableName(name, taken) {
  if (!name || !taken.has(name)) return name;
  let n = 2;
  while (taken.has(`${name}${n}`)) n += 1;
  return `${name}${n}`;
}

/**
 * Every list name a `query` writes into, except the one step named — plus the
 * engine's own `targets`, so a step titled "Targets" is named `targets2`
 * rather than having its results overwritten on a hand-started run.
 */
export function queryListNames(graph, exceptStepId) {
  const names = new Set([PICKED_TARGETS_LIST]);
  eachStep(graph, (step) => {
    if (step.type === STEP_TYPE.QUERY && step.into && step.id !== exceptStepId) names.add(step.into);
  });
  return names;
}

/** Applies `fn` to one step wherever it sits in the tree. */
export function mapStepById(graph, id, fn) {
  const walk = (steps) =>
    (steps ?? []).map((step) => {
      const next = step.id === id ? fn(step) : { ...step };
      if (step.whenTrue) next.whenTrue = walk(step.whenTrue);
      if (step.whenFalse) next.whenFalse = walk(step.whenFalse);
      if (step.body) next.body = walk(step.body);
      if (step.branches) next.branches = step.branches.map((b) => ({ ...b, steps: walk(b.steps) }));
      return next;
    });

  return { ...graph, stages: (graph.stages ?? []).map((s) => ({ ...s, steps: walk(s.steps) })) };
}

/** Applies `fn` to every condition in a definition, wherever one can appear. */
function mapConditions(graph, fn) {
  const mapSteps = (steps) =>
    (steps ?? []).map((step) => {
      const next = { ...step };

      if (step.condition) next.condition = fn(step.condition);
      if (step.until) next.until = fn(step.until);
      if (step.joinWhen) next.joinWhen = fn(step.joinWhen);
      if (step.filter) next.filter = fn(step.filter);

      if (step.whenTrue) next.whenTrue = mapSteps(step.whenTrue);
      if (step.whenFalse) next.whenFalse = mapSteps(step.whenFalse);
      if (step.body) next.body = mapSteps(step.body);
      if (step.branches) next.branches = step.branches.map((b) => ({ ...b, steps: mapSteps(b.steps) }));

      return next;
    });

  return {
    ...graph,
    stages: (graph.stages ?? []).map((stage) => ({
      ...stage,
      steps: mapSteps(stage.steps),
      transitions: (stage.transitions ?? []).map((t) => ({ ...t, condition: fn(t.condition) })),
    })),
  };
}

/** Rewrites one field name inside a FilterGroup, at any depth. */
function renameFieldInGroup(group, fromField, toField) {
  if (!group) return group;
  return {
    ...group,
    conditions: (group.conditions ?? []).map((c) =>
      c.field === fromField ? { ...c, field: toField } : c
    ),
    groups: (group.groups ?? []).map((g) => renameFieldInGroup(g, fromField, toField)),
  };
}

/**
 * Renames a step and every reference to it.
 *
 * A step id is not private any more: a condition reads a human task's answer as
 * `approve.outcome`. Since ids are derived from titles and never shown, editing
 * a title renames the id — so without this, retitling "Approve" would silently
 * break every condition that branched on its answer, and the workflow would save
 * clean and behave wrongly.
 */
export function renameStepEverywhere(graph, fromId, toId) {
  const renamed = mapConditions(graph, (group) =>
    renameFieldInGroup(group, `${fromId}${OUTCOME_FIELD_SUFFIX}`, `${toId}${OUTCOME_FIELD_SUFFIX}`)
  );

  const setId = (steps) =>
    (steps ?? []).map((step) => {
      const next = step.id === fromId ? { ...step, id: toId } : { ...step };
      // A Send notification step reading this task's details follows it.
      if (step.taskStepId === fromId) next.taskStepId = toId;
      if (step.whenTrue) next.whenTrue = setId(step.whenTrue);
      if (step.whenFalse) next.whenFalse = setId(step.whenFalse);
      if (step.body) next.body = setId(step.body);
      if (step.branches) next.branches = step.branches.map((b) => ({ ...b, steps: setId(b.steps) }));
      return next;
    });

  return { ...renamed, stages: renamed.stages.map((s) => ({ ...s, steps: setId(s.steps) })) };
}

/**
 * Renames the variable a `query` writes into, and every `forEach` reading it.
 *
 * `into` is derived from the step's title and never shown, so retitling a query
 * would otherwise orphan the loop walking its results.
 */
export function renameListEverywhere(graph, fromName, toName) {
  const retarget = (steps) =>
    (steps ?? []).map((step) => {
      const next = step.source === fromName ? { ...step, source: toName } : { ...step };
      if (step.whenTrue) next.whenTrue = retarget(step.whenTrue);
      if (step.whenFalse) next.whenFalse = retarget(step.whenFalse);
      if (step.body) next.body = retarget(step.body);
      if (step.branches) next.branches = step.branches.map((b) => ({ ...b, steps: retarget(b.steps) }));
      return next;
    });

  return { ...graph, stages: (graph.stages ?? []).map((s) => ({ ...s, steps: retarget(s.steps) })) };
}
