import { BuilderActions } from './actions';
import { builderReducer } from './reducer';

export const HistoryActions = { UNDO: 'history/undo', REDO: 'history/redo' };

const HISTORY_LIMIT = 50;

const HISTORY_RESETS = new Set([
  BuilderActions.LOADED,
  BuilderActions.RESET,
  BuilderActions.MARK_SAVED,
  BuilderActions.MARK_PUBLISHED,
]);

const HISTORY_SILENT = new Set([BuilderActions.PRUNE_ASSIGNEES]);

function coalesceKey(action) {
  switch (action.type) {
    case BuilderActions.SET_FIELD:
      return `field:${action.field}`;
    case BuilderActions.UPDATE_STAGE:
      return `stage:${action.stageId}:${Object.keys(action.patch ?? {}).join(',')}`;
    case BuilderActions.COMMIT_STAGE_TITLE:
      return `stage:${action.stageId}:title`;
    case BuilderActions.UPDATE_STEP:
      return `step:${action.stageId}:${JSON.stringify(action.container ?? [])}:${action.index}:${Object.keys(action.patch ?? {}).join(',')}`;
    case BuilderActions.COMMIT_STEP_TITLE:
      return `step:${action.stageId}:${JSON.stringify(action.container ?? [])}:${action.index}:title`;
    case BuilderActions.UPDATE_TRANSITION:
      return `transition:${action.stageId}:${action.index}`;
    case BuilderActions.UPDATE_VARIABLE:
      return `variable:${action.index}`;
    default:
      return null;
  }
}

export function emptyHistory(present) {
  return { present, past: [], future: [] };
}

export function historyReducer(state, action) {
  if (action.type === HistoryActions.UNDO) {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    return {
      present: previous,
      past: state.past.slice(0, -1),
      future: [state.present, ...state.future].slice(0, HISTORY_LIMIT),
    };
  }

  if (action.type === HistoryActions.REDO) {
    if (state.future.length === 0) return state;
    return {
      present: state.future[0],
      past: [...state.past, state.present].slice(-HISTORY_LIMIT),
      future: state.future.slice(1),
    };
  }

  const next = builderReducer(state.present, action);
  if (next === state.present) return state;

  if (HISTORY_RESETS.has(action.type)) return emptyHistory(next);
  if (HISTORY_SILENT.has(action.type)) return { ...state, present: next };

  const key = coalesceKey(action);
  if (key !== null && key === state.lastKey) {
    return { ...state, present: next, future: [] };
  }

  return {
    present: next,
    past: [...state.past, state.present].slice(-HISTORY_LIMIT),
    future: [],
    lastKey: key,
  };
}
