import { createFilterGroup, createTransition } from '@/models/workflow';

import { BuilderActions } from '../actions';
import { catchAllAt } from '../graph';
import { moveInArray, replaceStage } from './shared';

/**
 * Edits to a stage's transitions — the if / else-if chain that decides where a
 * run goes next, with at most one "otherwise" arm, always last.
 */

/**
 * A new conditional transition, inserted ABOVE the otherwise arm.
 *
 * The engine takes the first transition whose condition matches, and an
 * empty condition matches everything — so a transition added below a
 * catch-all could never be taken. Appending blindly was how the builder let
 * an author write dead branches and then told them, in a hint underneath,
 * to sort it out themselves.
 *
 * `action.condition` lets the caller seed the row with a real first
 * condition from the field catalog, which the reducer cannot know about. A
 * row seeded that way is immediately meaningful; one left empty would BE a
 * second catch-all, which validateDefinition then reports.
 */
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

/**
 * The otherwise arm: at most one, always last.
 *
 * It is stored as an ordinary transition with an empty condition, because
 * that is what the wire format has — but the builder never lets a second
 * one exist, and never lets this one leave the end of the list.
 */
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

// Reordering is for the conditional rows only — the otherwise arm is last
// by definition, so a drag that would displace it is dropped rather than
// silently producing a definition whose tail can never be reached.
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
