import { createStage } from '@/models/workflow';
import { slugify, uniqueSlug } from '@/utils/slug';

import { BuilderActions } from '../actions';
import { nextStageTitle } from '../definition';
import { collectIds } from '../graph';
import { retargetStageId } from '../references';
import { moveInArray, replaceStage } from './shared';

function addStage(state, action) {
  const title = action.title ?? nextStageTitle(state.graph.stages);
  const id = uniqueSlug(title, collectIds(state.graph), 'stage');
  const stage = createStage({ id, title, transitions: [] });
  return {
    ...state,
    graph: {
      ...state.graph,
      startStageId: state.graph.stages.length === 0 ? id : state.graph.startStageId,
      stages: [...state.graph.stages, stage],
    },
  };
}

function updateStage(state, action) {
  return replaceStage(state, action.stageId, (s) => ({ ...s, ...action.patch }));
}

function commitStageTitle(state, action) {
  const stage = state.graph.stages.find((s) => s.id === action.stageId);
  if (!stage) return state;

  const desired = slugify(stage.title ?? '');
  if (!desired || desired === stage.id) return state;

  return renameStageId(state, {
    type: BuilderActions.RENAME_STAGE_ID,
    stageId: action.stageId,
    nextId: desired,
  });
}

function renameStageId(state, action) {
  const desired = slugify(action.nextId);
  if (!desired || desired === action.stageId) return state;

  const taken = collectIds(state.graph);
  taken.delete(action.stageId);
  const nextId = uniqueSlug(desired, taken, 'stage');

  const renamed = {
    ...state.graph,
    stages: state.graph.stages.map((s) => (s.id === action.stageId ? { ...s, id: nextId } : s)),
  };

  return { ...state, graph: retargetStageId(renamed, action.stageId, nextId) };
}

function removeStage(state, action) {
  const stages = state.graph.stages.filter((s) => s.id !== action.stageId);

  const cleaned = retargetStageId({ ...state.graph, stages }, action.stageId, null);

  return {
    ...state,
    graph: {
      ...cleaned,
      startStageId:
        cleaned.startStageId === null && stages.length > 0 ? stages[0].id : cleaned.startStageId,
    },
  };
}

function moveStage(state, action) {
  return {
    ...state,
    graph: {
      ...state.graph,
      stages: moveInArray(state.graph.stages, action.from, action.to),
    },
  };
}

function setStartStage(state, action) {
  return { ...state, graph: { ...state.graph, startStageId: action.stageId } };
}

function setStageDeadline(state, action) {
  return replaceStage(state, action.stageId, (stage) => {
    if (!action.deadline) {
      const { deadline, ...rest } = stage;
      return rest;
    }
    return { ...stage, deadline: action.deadline };
  });
}

function insertStages(state, action) {
  if (!action.stages?.length) return state;
  const stages = [...state.graph.stages];
  stages.splice(Math.min(Math.max(action.index ?? stages.length, 0), stages.length), 0, ...action.stages);
  return { ...state, graph: { ...state.graph, stages } };
}

function moveItems(state, action) {
  if (!action.graph || action.graph === state.graph) return state;
  return { ...state, graph: action.graph };
}

export const stageHandlers = {
  [BuilderActions.ADD_STAGE]: addStage,
  [BuilderActions.UPDATE_STAGE]: updateStage,
  [BuilderActions.COMMIT_STAGE_TITLE]: commitStageTitle,
  [BuilderActions.RENAME_STAGE_ID]: renameStageId,
  [BuilderActions.REMOVE_STAGE]: removeStage,
  [BuilderActions.MOVE_STAGE]: moveStage,
  [BuilderActions.SET_START_STAGE]: setStartStage,
  [BuilderActions.SET_STAGE_DEADLINE]: setStageDeadline,
  [BuilderActions.INSERT_STAGES]: insertStages,
  [BuilderActions.MOVE_ITEMS]: moveItems,
};
