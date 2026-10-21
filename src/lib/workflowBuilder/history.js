import { BuilderActions } from './actions';
import { builderReducer } from './reducer';

/**
 * Undo / redo around the builder's reducer — which stays pure and ignorant of
 * history; this wraps it.
 */

export const HistoryActions = { UNDO: 'history/undo', REDO: 'history/redo' };

/** Deep enough to cover a long editing session; shallow enough not to hoard graphs. */
const HISTORY_LIMIT = 50;

/**
 * Actions that replace the whole document rather than edit it.
 *
 * Undoing across one of these is meaningless — you cannot un-load a definition
 * back into the previous one's edits — so the stack restarts. MARK_SAVED is
 * here for a subtler reason: it stamps a new clean baseline, and an undo that
 * restored the OLD baseline would leave the dirty flag disagreeing with what
 * the server actually holds.
 */
const HISTORY_RESETS = new Set([
  BuilderActions.LOADED,
  BuilderActions.RESET,
  BuilderActions.MARK_SAVED,
  // Publishing changes what the open document IS (the draft became a live
  // version); undoing back to "a draft" would describe a draft that is gone.
  BuilderActions.MARK_PUBLISHED,
]);

/**
 * Edits that happen TO the author rather than BY them.
 *
 * Pruning departed assignees runs from an effect the moment the directory
 * lookup lands. Undoing it would put invalid ids back, the effect would strip
 * them again, and the author would see an undo that did nothing.
 */
const HISTORY_SILENT = new Set([BuilderActions.PRUNE_ASSIGNEES]);

/**
 * Identifies a run of edits that should collapse into ONE undo step.
 *
 * Typing a stage title dispatches an action per keystroke. Without this, one
 * Ctrl+Z would delete one character — technically correct and completely
 * useless. Consecutive actions sharing a key merge; anything else in between
 * breaks the run, which is what makes "undo my last edit" mean a whole edit.
 *
 * No clock is involved. Coalescing on key equality alone keeps the reducer
 * pure, and the only behaviour it costs is that returning to a field much later
 * with nothing touched in between extends the earlier run instead of starting
 * a new one.
 */
function coalesceKey(action) {
  switch (action.type) {
    case BuilderActions.SET_FIELD:
      return `field:${action.field}`;
    case BuilderActions.UPDATE_STAGE:
      return `stage:${action.stageId}:${Object.keys(action.patch ?? {}).join(',')}`;
    // The blur that realigns an id belongs to the run of keystrokes that
    // renamed the thing, not to a step of its own — otherwise one Ctrl+Z would
    // revert the id and leave the new title sitting above it.
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

/** A fresh history around a starting document. */
export function emptyHistory(present) {
  return { present, past: [], future: [] };
}

/**
 * `builderReducer` with an undo stack around it.
 *
 * The document reducer stays exactly as it was — pure, testable, ignorant of
 * history — and this wraps it. Anything that leaves the document identical
 * (a refused drag, a no-op patch) records nothing, so undo never burns a step
 * on an edit that did not happen.
 */
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
