import { STEP_TYPE } from '@/constants/workflow';
import { slugify, uniqueSlug } from '@/utils/slug';

import { BuilderActions } from '../actions';
import { nextStepTitle } from '../definition';
import { collectIds, getStepContainer, setStepContainer } from '../graph';
import {
  mapStepById,
  queryListNames,
  renameListEverywhere,
  renameStepEverywhere,
  uniqueVariableName,
  variableNameFrom,
} from '../references';
import { moveInArray, replaceStage } from './shared';

function pruneAssignees(state, action) {
  const invalid = action.invalid;
  const removed = [];

  const pruneSteps = (steps) =>
    (steps ?? []).map((step) => {
      const next = { ...step };

      const assigned = step.assignToUserIds ?? [];
      const kept = assigned.filter((id) => !invalid.has(id));
      if (kept.length !== assigned.length) {
        for (const id of assigned.filter((x) => invalid.has(x))) {
          removed.push({
            stepId: step.id,
            stepTitle: step.title || step.id,
            userId: id,
            displayName: invalid.get(id).displayName,
            reason: invalid.get(id).reason,
            stillAssigned: kept.length + (step.assignToRoleIds?.length ?? 0) + (step.assignToGroupIds?.length ?? 0) > 0,
          });
        }
        next.assignToUserIds = kept;
      }

      if (step.whenTrue) next.whenTrue = pruneSteps(step.whenTrue);
      if (step.whenFalse) next.whenFalse = pruneSteps(step.whenFalse);
      if (step.body) next.body = pruneSteps(step.body);
      if (step.branches) {
        next.branches = step.branches.map((b) => ({ ...b, steps: pruneSteps(b.steps) }));
      }

      return next;
    });

  const stages = state.graph.stages.map((stage) => ({ ...stage, steps: pruneSteps(stage.steps) }));
  if (removed.length === 0) return state;

  return {
    ...state,
    graph: { ...state.graph, stages },
    removedAssignees: [...(state.removedAssignees ?? []), ...removed],
  };
}

function addStep(state, action) {
  const container = action.container ?? [];
  const title = action.step.title?.trim() ? action.step.title : nextStepTitle(state.graph);
  const id = uniqueSlug(title, collectIds(state.graph), 'step');

  return replaceStage(state, action.stageId, (stage) => {
    const list = getStepContainer(stage, container);
    const step = { ...action.step, title, id };
    if (step.type === STEP_TYPE.QUERY) {
      step.into = uniqueVariableName(variableNameFrom(step.title) || 'results', queryListNames(state.graph));
    }
    return setStepContainer(stage, container, [...list, step]);
  });
}

function updateStep(state, action) {
  const container = action.container ?? [];
  return replaceStage(state, action.stageId, (stage) => {
    const list = getStepContainer(stage, container);
    return setStepContainer(
      stage,
      container,
      list.map((s, i) => (i === action.index ? { ...s, ...action.patch } : s))
    );
  });
}

function commitStepTitle(state, action) {
  const container = action.container ?? [];
  const stage = state.graph.stages.find((s) => s.id === action.stageId);
  if (!stage) return state;

  const current = getStepContainer(stage, container)[action.index];
  if (!current) return state;

  let graph = state.graph;
  let stepId = current.id;

  const taken = collectIds(state.graph);
  taken.delete(current.id);
  const nextId = uniqueSlug(current.title ?? '', taken, 'step');

  if (nextId && nextId !== current.id) {
    graph = renameStepEverywhere(graph, current.id, nextId);
    stepId = nextId;
  }

  if (current.type === STEP_TYPE.QUERY) {
    const nextInto = uniqueVariableName(variableNameFrom(current.title ?? ''), queryListNames(graph, stepId));
    if (current.into && nextInto && nextInto !== current.into) {
      graph = renameListEverywhere(graph, current.into, nextInto);
      graph = mapStepById(graph, stepId, (s) => ({ ...s, into: nextInto }));
    }
  }

  return graph === state.graph ? state : { ...state, graph };
}

function renameStepId(state, action) {
  const container = action.container ?? [];
  const desired = slugify(action.nextId);
  if (!desired) return state;

  return replaceStage(state, action.stageId, (stage) => {
    const list = getStepContainer(stage, container);
    const current = list[action.index];
    if (!current || desired === current.id) return stage;

    const taken = collectIds(state.graph);
    taken.delete(current.id);
    const nextId = uniqueSlug(desired, taken, 'step');

    return setStepContainer(
      stage,
      container,
      list.map((s, i) => (i === action.index ? { ...s, id: nextId } : s))
    );
  });
}

function removeStep(state, action) {
  const container = action.container ?? [];
  return replaceStage(state, action.stageId, (stage) => {
    const list = getStepContainer(stage, container);
    return setStepContainer(stage, container, list.filter((_, i) => i !== action.index));
  });
}

function moveStep(state, action) {
  const container = action.container ?? [];
  return replaceStage(state, action.stageId, (stage) => {
    const list = getStepContainer(stage, container);
    return setStepContainer(stage, container, moveInArray(list, action.from, action.to));
  });
}

function insertSteps(state, action) {
  if (!action.steps?.length) return state;
  const container = action.container ?? [];
  return replaceStage(state, action.stageId, (stage) => {
    const list = [...getStepContainer(stage, container)];
    list.splice(Math.min(Math.max(action.index ?? list.length, 0), list.length), 0, ...action.steps);
    return setStepContainer(stage, container, list);
  });
}

export const stepHandlers = {
  [BuilderActions.PRUNE_ASSIGNEES]: pruneAssignees,
  [BuilderActions.ADD_STEP]: addStep,
  [BuilderActions.UPDATE_STEP]: updateStep,
  [BuilderActions.COMMIT_STEP_TITLE]: commitStepTitle,
  [BuilderActions.RENAME_STEP_ID]: renameStepId,
  [BuilderActions.REMOVE_STEP]: removeStep,
  [BuilderActions.MOVE_STEP]: moveStep,
  [BuilderActions.INSERT_STEPS]: insertSteps,
};
