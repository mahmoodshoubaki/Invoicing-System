import { ASSIGNEE_TYPE } from '@/constants/workflow';

/**
 * @typedef {Object} WorkflowInstance
 * @property {string} instanceId
 * @property {string} definitionCode
 * @property {number} definitionVersion
 * @property {number} statusKey
 * @property {string} status
 * @property {string|null} currentStageId
 * @property {string|null} currentStageTitle
 * @property {string|null} currentStepId
 * @property {string|null} failureReason
 * @property {string|null} delayUntil
 * @property {string|null} stageDeadlineOn
 * @property {Object} branches
 * @property {Array} pendingTasks
 * @property {Array} history
 */

/**
 * @param {Object} raw
 * @returns {WorkflowInstance|null}
 */
function mapAssignees(raw) {
  const named = (typeKey) => (raw?.assignees ?? [])
    .filter((a) => a?.assigneeTypeKey === typeKey && a.name)
    .map((a) => ({ id: a.assigneeId ?? null, name: a.name }));

  const groups = (raw?.assignees ?? [])
    .filter((a) => a?.assigneeTypeKey === ASSIGNEE_TYPE.GROUP)
    .map((a) => ({ id: a.assigneeId ?? null, name: a.name || 'Deleted group' }));

  return {
    assignedUsers: named(ASSIGNEE_TYPE.USER),
    assignedRoles: named(ASSIGNEE_TYPE.ROLE),
    assignedGroups: groups,
    reassignedToName: raw?.reassignedToName ?? null,
  };
}

export function mapInstance(raw) {
  if (!raw) return null;

  return {
    instanceId:        raw.instanceId,
    definitionCode:    raw.definitionCode ?? null,
    definitionVersion: raw.definitionVersion ?? null,
    statusKey:         raw.statusKey ?? null,
    status:            raw.status ?? null,
    currentStageId:    raw.currentStageId ?? null,
    currentStageTitle: raw.currentStageTitle ?? null,
    currentStepId:     raw.currentStepId ?? null,
    targetIds:         raw.targetIds ?? [],
    targetTypeKey:     raw.targetTypeKey ?? null,
    projectCode:       raw.projectCode ?? null,
    failureReason:     raw.failureReason ?? null,
    delayUntil:        raw.delayUntil ?? null,
    stageDeadlineOn:   raw.stageDeadlineOn ?? null,
    branches:          raw.branches ?? {},
    returnStageId:     raw.returnStageId ?? null,
    returnStageTitle:  raw.returnStageTitle ?? null,
    returnStepId:      raw.returnStepId ?? null,

    startedOn:         raw.startedOn ?? null,
    completedOn:       raw.completedOn ?? null,
    pendingTaskCount:  raw.pendingTaskCount ?? 0,
  };
}

export function mapInstanceTaskRow(raw) {
  return {
    taskId:      raw.taskId,
    stepId:      raw.stepId ?? null,
    title:       raw.title ?? null,
    dueOn:       raw.dueOn ?? null,
    statusKey:   raw.statusKey ?? null,
    status:      raw.status ?? null,
    outcome:     raw.outcome ?? raw.outcomeKey ?? null,
    outcomes:    raw.outcomes ?? [],
    comment:     raw.comment ?? null,
    // The reason given with the answer: the label as picked, or the typed text.
    reasonKey:   raw.reasonKey ?? null,
    reason:      raw.reason ?? null,

    completedBy:     raw.completedBy ?? null,
    completedByName: raw.completedByName ?? null,

    completedOn: raw.completedOn ?? null,

    ...mapAssignees(raw),
  };
}

export function mapInstanceVariable(raw) {
  return {
    name: raw?.name ?? '',
    type: raw?.type ?? null,
    value: raw?.value === undefined ? null : raw.value,
  };
}

export function mapInstanceTask(raw) {
  return {
    taskId:   raw.taskId,
    stepId:   raw.stepId ?? null,
    title:    raw.title ?? null,
    dueOn:    raw.dueOn ?? null,
    outcomes: raw.outcomes ?? [],
  };
}

export function mapHistoryRow(raw) {
  return {
    fromStageId:    raw.fromStageId ?? null,
    fromStageTitle: raw.fromStageTitle ?? null,
    toStageId:      raw.toStageId ?? null,
    toStageTitle:   raw.toStageTitle ?? null,
    toStatusKey:    raw.toStatusKey ?? null,
    performedOn:    raw.performedOn ?? null,

    performedBy:     raw.performedBy ?? null,
    performedByName: raw.performedByName ?? null,

    notes:          raw.notes ?? null,

    correlationId:  raw.correlationId ?? null,
  };
}

/**
 * @param {Object} raw
 */
export function mapInstanceRow(raw) {
  return {
    instanceId:        raw.instanceId,
    definitionCode:    raw.definitionCode ?? null,
    definitionVersion: raw.definitionVersion ?? null,
    statusKey:         raw.statusKey ?? null,
    status:            raw.status ?? null,
    currentStageId:    raw.currentStageId ?? null,
    currentStageTitle: raw.currentStageTitle ?? null,
    targetIds:         raw.targetIds ?? [],
    targetTypeKey:     raw.targetTypeKey > 0 ? raw.targetTypeKey : null,
    startedOn:         raw.startedOn ?? null,
    completedOn:       raw.completedOn ?? null,
    projectCode:       raw.projectCode ?? null,
    failureReason:     raw.failureReason ?? null,
    delayUntil:        raw.delayUntil ?? null,
    stageDeadlineOn:   raw.stageDeadlineOn ?? null,
    pendingTaskCount:  raw.pendingTaskCount ?? 0,
  };
}

/**
 * @param {Object} raw
 */
export function mapMyTask(raw) {
  return {
    taskId:            raw.taskId,
    instanceId:        raw.instanceId,
    stepId:            raw.stepId ?? null,
    title:             raw.title ?? null,
    createdOn:         raw.createdOn ?? raw.CreatedOn ?? null,
    dueOn:             raw.dueOn ?? null,
    isOverdue:         raw.isOverdue === true,
    definitionCode:    raw.definitionCode ?? null,
    definitionName:    raw.definitionName ?? null,
    definitionVersion: raw.definitionVersion ?? null,
    currentStageId:    raw.currentStageId ?? null,
    currentStageTitle: raw.currentStageTitle ?? null,
    canAct:            raw.canAct === true,

    runStatusKey:      raw.runStatusKey ?? null,

    statusKey:         raw.statusKey ?? null,

    projectCode:       raw.projectCode ?? null,

    targetTypeKey:     raw.targetTypeKey > 0 ? raw.targetTypeKey : null,
    targetIds:         raw.targetIds ?? [],

    ...mapAssignees(raw),

    buttons:           (raw.buttons ?? []).map(mapTaskButton),

    fields:            (raw.fields ?? []).map(mapTaskField),
  };
}

export function mapTaskButton(raw) {
  return {
    key:             raw.key,
    label:           raw.label ?? raw.key,
    requiresComment: raw.requiresComment === true,
    requiresFields:  raw.requiresFields === true,
    colorHex:        raw.colorHex ?? null,
    reasons:         raw.reasons
      ? { required: raw.reasons.required === true, options: (raw.reasons.options ?? []).map((o) => ({ key: o.key, label: o.label ?? o.key })) }
      : null,
  };
}

export function mapTaskField(raw) {
  return {
    name:     raw.name,
    label:    raw.label ?? raw.name,
    // text, number, date or boolean
    typeKey:  raw.typeKey ?? 'text',
    required: raw.required === true,
    value:    raw.value ?? null,
  };
}
