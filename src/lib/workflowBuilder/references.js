import { OUTCOME_FIELD_SUFFIX, PICKED_TARGETS_LIST, STEP_TYPE } from '@/constants/workflow';
import { slugify } from '@/utils/slug';

import { eachStep } from './graph';

export function retargetStageId(graph, fromId, toId) {
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

export function variableNameFrom(title) {
  const parts = slugify(title).split('-').filter(Boolean);
  if (parts.length === 0) return '';
  return parts[0] + parts.slice(1).map((p) => p[0].toUpperCase() + p.slice(1)).join('');
}

/**
 * @param {string} name
 * @param {Set<string>} taken
 */
export function uniqueVariableName(name, taken) {
  if (!name || !taken.has(name)) return name;
  let n = 2;
  while (taken.has(`${name}${n}`)) n += 1;
  return `${name}${n}`;
}

export function queryListNames(graph, exceptStepId) {
  const names = new Set([PICKED_TARGETS_LIST]);
  eachStep(graph, (step) => {
    if (step.type === STEP_TYPE.QUERY && step.into && step.id !== exceptStepId) names.add(step.into);
  });
  return names;
}

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

export function renameStepEverywhere(graph, fromId, toId) {
  const renamed = mapConditions(graph, (group) =>
    renameFieldInGroup(group, `${fromId}${OUTCOME_FIELD_SUFFIX}`, `${toId}${OUTCOME_FIELD_SUFFIX}`)
  );

  const setId = (steps) =>
    (steps ?? []).map((step) => {
      const next = step.id === fromId ? { ...step, id: toId } : { ...step };
      if (step.taskStepId === fromId) next.taskStepId = toId;
      if (step.whenTrue) next.whenTrue = setId(step.whenTrue);
      if (step.whenFalse) next.whenFalse = setId(step.whenFalse);
      if (step.body) next.body = setId(step.body);
      if (step.branches) next.branches = step.branches.map((b) => ({ ...b, steps: setId(b.steps) }));
      return next;
    });

  return { ...renamed, stages: renamed.stages.map((s) => ({ ...s, steps: setId(s.steps) })) };
}

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
