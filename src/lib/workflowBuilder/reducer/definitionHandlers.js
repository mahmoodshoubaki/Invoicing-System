import { TRIGGER_KIND } from '@/constants/workflow';
import { createTrigger } from '@/models/workflow';

import { BuilderActions } from '../actions';
import { emptyDefinition, fromDefinition, withBaseline } from '../definition';

/**
 * Edits to the workflow as a whole: loading, saving, its settings, its trigger
 * and its variables.
 */

function loaded(state, action) {
  return fromDefinition(action.definition);
}

function reset() {
  return emptyDefinition();
}

// After a successful save the current content IS the saved content: the
// workflow's draft (2026-10-11), with the code, id and stamp the server gave it.
// A save never makes a version, so whatever was open — the live version, an
// older one — is now the draft.
function markSaved(state, action) {
  return withBaseline({
    ...state,
    code: action.saved?.code ?? state.code,
    id: action.saved?.id ?? state.id,
    stamp: action.saved?.stamp ?? null,
    isDraft: true,
    version: null,
    // A draft is never the live one — publishing is separate.
    isActive: false,
  });
}

// The draft was published: the same content is now version N, live, and the
// draft is gone — so the next save sends no stamp.
function markPublished(state, action) {
  return withBaseline({
    ...state,
    id: action.published?.definitionId ?? state.id,
    version: action.published?.version ?? null,
    isActive: true,
    isDraft: false,
    stamp: null,
  });
}

function setField(state, action) {
  return { ...state, [action.field]: action.value };
}

/*
 * Changing what a workflow tracks, and dropping an event that no longer
 * belongs to it.
 *
 * An event belongs to ONE target type, so switching from Invoice to
 * anything else invalidates `InvoiceSubmitted`. Left alone it stayed in
 * state and the two halves of the screen disagreed: the settings panel's
 * dropdown filters by target and so showed blank, while the canvas trigger
 * node read `eventName` straight out of state and still said
 * "InvoiceSubmitted". The save then carried the stale name and the backend
 * refused it with WF-023, naming a field the author could not see.
 *
 * The catalog stays out of the reducer — the panel passes the names that
 * survive the change, because it is the thing holding GetEvents.
 */
function setTargetType(state, action) {
  const next = { ...state, targetTypeKey: action.targetTypeKey };
  const trigger = state.trigger;

  if (
    trigger?.kind === TRIGGER_KIND.EVENT
    && trigger.eventName
    && !(action.validEventNames ?? []).includes(trigger.eventName)
  ) {
    // Cleared rather than swapped for another target's first event: which
    // event a workflow listens for is the author's decision, not a default
    // worth guessing at.
    next.trigger = createTrigger.event({ eventName: '' });
  }

  return next;
}

function setTrigger(state, action) {
  return { ...state, trigger: action.trigger };
}

// Sits beside `startStageId` and `stages` in the saved graph, as the
// backend's WorkflowGraph has it.
function setRunNotifications(state, action) {
  return { ...state, graph: { ...state.graph, notifications: action.notifications } };
}

function addVariable(state, action) {
  return { ...state, variables: [...state.variables, action.variable] };
}

function updateVariable(state, action) {
  return {
    ...state,
    variables: state.variables.map((v, i) => (i === action.index ? { ...v, ...action.patch } : v)),
  };
}

function removeVariable(state, action) {
  return { ...state, variables: state.variables.filter((_, i) => i !== action.index) };
}

export const definitionHandlers = {
  [BuilderActions.LOADED]: loaded,
  [BuilderActions.RESET]: reset,
  [BuilderActions.MARK_SAVED]: markSaved,
  [BuilderActions.MARK_PUBLISHED]: markPublished,
  [BuilderActions.SET_FIELD]: setField,
  [BuilderActions.SET_TARGET_TYPE]: setTargetType,
  [BuilderActions.SET_TRIGGER]: setTrigger,
  [BuilderActions.SET_RUN_NOTIFICATIONS]: setRunNotifications,
  [BuilderActions.ADD_VARIABLE]: addVariable,
  [BuilderActions.UPDATE_VARIABLE]: updateVariable,
  [BuilderActions.REMOVE_VARIABLE]: removeVariable,
};
