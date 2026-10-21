import { createStage } from '@/models/workflow';
import { slugify, uniqueSlug } from '@/utils/slug';

import { BuilderActions } from '../actions';
import { nextStageTitle } from '../definition';
import { collectIds } from '../graph';
import { retargetStageId } from '../references';
import { moveInArray, replaceStage } from './shared';

/** Edits to stages: adding, renaming, removing, ordering, deadlines, pasting. */

function addStage(state, action) {
  // Numbered when no title is given — see nextStageTitle. The id follows
  // the title once, at creation ("Stage 3" → `stage-3`), and is never
  // re-derived when the title is later renamed.
  const title = action.title ?? nextStageTitle(state.graph.stages);
  const id = uniqueSlug(title, collectIds(state.graph), 'stage');
  const stage = createStage({ id, title, transitions: [] });
  return {
    ...state,
    graph: {
      // Spread first: the graph carries more than stages — the run-level
      // `notifications` block lives here too, and rebuilding without it
      // would quietly reset every checkbox to the engine's defaults.
      ...state.graph,
      // First stage added to an empty graph becomes the start — otherwise
      // the definition is invalid the moment it is created.
      startStageId: state.graph.stages.length === 0 ? id : state.graph.startStageId,
      stages: [...state.graph.stages, stage],
    },
  };
}

/**
 * Title edits do NOT touch the id.
 *
 * Ids are derived from titles, but deriving them on every keystroke changed
 * the React key of the node being typed into, which unmounted and remounted
 * it — the cursor left the input after one character. Ids are now recomputed
 * when the title is committed (on blur), by COMMIT_STAGE_TITLE.
 */
function updateStage(state, action) {
  return replaceStage(state, action.stageId, (s) => ({ ...s, ...action.patch }));
}

/**
 * Blur: bring the id back in line with the title, and carry every reference
 * with it. Ids are never shown or editable any more, so there is no "was it
 * edited by hand?" case to preserve — a title is the only source.
 */
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

  // Exclude the stage's own current id so renaming "review" to "review"
  // via a no-op edit does not push it to "review-2".
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

  // Transitions into a deleted stage become "end the run" rather than
  // dangling pointers the backend would reject on save.
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

// A deadline is omitted entirely when cleared rather than sent as null —
// the field's absence is what "no deadline" means.
function setStageDeadline(state, action) {
  return replaceStage(state, action.stageId, (stage) => {
    if (!action.deadline) {
      const { deadline, ...rest } = stage;
      return rest;
    }
    return { ...stage, deadline: action.deadline };
  });
}

/*
 * A paste. The pieces arrive already prepared by `workflowClipboard` — new
 * ids, links pointed at the right copies — so these only place them. One
 * action per paste, which is what makes one Ctrl+Z take the whole paste back.
 *
 * `index` is where the first pasted item lands; past the end appends.
 */
function insertStages(state, action) {
  if (!action.stages?.length) return state;
  const stages = [...state.graph.stages];
  stages.splice(Math.min(Math.max(action.index ?? stages.length, 0), stages.length), 0, ...action.stages);
  return { ...state, graph: { ...state.graph, stages } };
}

/*
 * A cut, pasted: the whole graph with stages or steps moved, as worked out
 * by `workflowClipboard` — ids kept, so nothing pointing at them breaks.
 * Taken as one graph rather than a remove plus an insert so that one
 * Ctrl+Z puts everything back where it was.
 */
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
