/**
 * The workflow builder's editing state — kept at this address for the files
 * that import it. Everything now lives in small modules under ./workflowBuilder/:
 *
 *   actions.js            every edit the reducer understands
 *   reducer.js            the reducer; each action's handler lives in reducer/ by area
 *                         (definition, stages, transitions, steps)
 *   history.js            undo / redo around it
 *   definition.js         a blank workflow, loading one, default titles, the dirty baseline
 *   graph.js              walking the graph: every step, every id, addressing a step's list
 *   variables.js          what a variable starts as; whether a value fits its type
 *   references.js         carrying references when an id or a list name changes
 *   fields.js             what a condition can read
 *   validation/           the save's rules — the definition's, and one file per step type
 */

export { BuilderActions } from '@/lib/workflowBuilder/actions';
export { builderReducer } from '@/lib/workflowBuilder/reducer';
export { HistoryActions, emptyHistory, historyReducer } from '@/lib/workflowBuilder/history';
export {
  nextStageTitle,
  DEFAULT_STEP_TITLE,
  stepNumbering,
  nextStepTitle,
  emptyDefinition,
  fromDefinition,
  editableSnapshot,
  isDirty,
} from '@/lib/workflowBuilder/definition';
export { catchAllAt, collectIds, eachStep, getStepContainer } from '@/lib/workflowBuilder/graph';
export { emptyForType, defaultValueErrors, typeMismatch, declaredVariableNames } from '@/lib/workflowBuilder/variables';
export { variableNameFrom, uniqueVariableName } from '@/lib/workflowBuilder/references';
export {
  conditionFields,
  availableLists,
  referencedPersonIds,
  ITEM_TARGET_ID,
  itemFields,
  isItemShapeUnknown,
} from '@/lib/workflowBuilder/fields';
export { validateDefinition } from '@/lib/workflowBuilder/validation/validateDefinition';
export { validateStep } from '@/lib/workflowBuilder/validation/validateStep';
export { validateStageDeadline } from '@/lib/workflowBuilder/validation/stageDeadline';
