/**
 * Workflow models — response mappers and request builders, kept at this address
 * for the files that import it. Each kind lives in its own file under ./workflow/:
 *
 *   definitions.js   definitions and their catalogs (fields, events, actions, target types)
 *   instances.js     runs, their history, and people's tasks
 *   settings.js      engine limits and approved API hosts
 *   conditions.js    FilterGroup / condition builders
 *   steps.js         STEP builders — the only place a step object may be built
 *                    (its `type` must be the first key, or the backend fails with a 500)
 *   graph.js         triggers, variables, transitions, stages, the graph
 *   payloads.js      request bodies for saving and for acting on runs and tasks
 */

export {
  mapDefinitionRow,
  mapDefinition,
  mapVersionRow,
  mapProblem,
  mapBlockedRun,
  mapField,
  mapEvent,
  mapAction,
  mapActionInput,
  mapTargetType,
} from '@/models/workflow/definitions';
export {
  mapInstance,
  mapInstanceTaskRow,
  mapInstanceTask,
  mapHistoryRow,
  mapInstanceRow,
  mapInstanceVariable,
  mapMyTask,
  mapTaskButton,
  mapTaskField,
} from '@/models/workflow/instances';
export {
  mapWorkflowSetting,
  mapFieldSetting,
  createSaveFieldSettingsPayload,
  createUpdateSettingPayload,
  mapApiDomain,
  createApproveApiDomainPayload,
  createSetApiDomainEnabledPayload,
} from '@/models/workflow/settings';
export { createFilterGroup, createFilterCondition, isEmptyFilterGroup } from '@/models/workflow/conditions';
export { createStep, createParallelBranch, createOutcome } from '@/models/workflow/steps';
export {
  createTrigger,
  createVariable,
  createTransition,
  createStageDeadline,
  createStage,
  createGraph,
} from '@/models/workflow/graph';
export {
  createDefinitionPayload,
  createStartInstancePayload,
  createAdvanceInstancePayload,
  createResumeInstancePayload,
  createCancelInstancePayload,
  createPauseInstancePayload,
  createReassignTaskPayload,
  createCompleteTaskPayload,
  createCompleteTaskWithFilesFormData,
} from '@/models/workflow/payloads';
