import { TRIGGER_KIND } from '@/constants/workflow';
import { createTrigger } from '@/models/workflow';

import { BuilderActions } from '../actions';
import { emptyDefinition, fromDefinition, withBaseline } from '../definition';

function loaded(state, action) {
  return fromDefinition(action.definition);
}

function reset() {
  return emptyDefinition();
}

function markSaved(state, action) {
  return withBaseline({
    ...state,
    code: action.saved?.code ?? state.code,
    id: action.saved?.id ?? state.id,
    stamp: action.saved?.stamp ?? null,
    isDraft: true,
    version: null,
    isActive: false,
  });
}

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

function setTargetType(state, action) {
  const next = { ...state, targetTypeKey: action.targetTypeKey };
  const trigger = state.trigger;

  if (
    trigger?.kind === TRIGGER_KIND.EVENT
    && trigger.eventName
    && !(action.validEventNames ?? []).includes(trigger.eventName)
  ) {
    next.trigger = createTrigger.event({ eventName: '' });
  }

  return next;
}

function setTrigger(state, action) {
  return { ...state, trigger: action.trigger };
}

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
