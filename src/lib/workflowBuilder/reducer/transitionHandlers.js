import { createFilterGroup, createTransition } from '@/models/workflow';

import { BuilderActions } from '../actions';
import { catchAllAt } from '../graph';
import { moveInArray, replaceStage } from './shared';

function addTransition(state, action) {
  return replaceStage(state, action.stageId, (stage) => {
    const list = stage.transitions ?? [];
    const next = [...list];
    next.splice(catchAllAt(list) === -1 ? list.length : catchAllAt(list), 0,
      createTransition({
        condition: action.condition ?? createFilterGroup(),
        toStageId: action.toStageId ?? null,
      }));
    return { ...stage, transitions: next };
  });
}

function setCatchAll(state, action) {
  return replaceStage(state, action.stageId, (stage) => {
    const list = stage.transitions ?? [];
    const at = catchAllAt(list);
    const body = at === -1 ? list : list.filter((_, i) => i !== at);
    if (!action.enabled) return { ...stage, transitions: body };
    return {
      ...stage,
      transitions: [
        ...body,
        createTransition({ condition: createFilterGroup(), toStageId: action.toStageId ?? null }),
      ],
    };
  });
}

function updateTransition(state, action) {
  return replaceStage(state, action.stageId, (stage) => ({
    ...stage,
    transitions: stage.transitions.map((t, i) => (i === action.index ? { ...t, ...action.patch } : t)),
  }));
}

function removeTransition(state, action) {
  return replaceStage(state, action.stageId, (stage) => ({
    ...stage,
    transitions: stage.transitions.filter((_, i) => i !== action.index),
  }));
}

function moveTransition(state, action) {
  return replaceStage(state, action.stageId, (stage) => {
    const list = stage.transitions ?? [];
    const limit = catchAllAt(list) === -1 ? list.length : catchAllAt(list);
    if (action.from >= limit || action.to >= limit) return stage;
    return { ...stage, transitions: moveInArray(list, action.from, action.to) };
  });
}

export const transitionHandlers = {
  [BuilderActions.ADD_TRANSITION]: addTransition,
  [BuilderActions.SET_CATCH_ALL]: setCatchAll,
  [BuilderActions.UPDATE_TRANSITION]: updateTransition,
  [BuilderActions.REMOVE_TRANSITION]: removeTransition,
  [BuilderActions.MOVE_TRANSITION]: moveTransition,
};
