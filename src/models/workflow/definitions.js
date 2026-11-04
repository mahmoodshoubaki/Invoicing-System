/**
 * @typedef {Object} WorkflowDefinitionRow
 * @property {string} code
 * @property {string} name
 * @property {string|null} description
 * @property {number} targetTypeKey
 * @property {number} triggerTypeKey
 * @property {number|null} latestVersion
 * @property {number|null} activeVersion
 * @property {string|null} activeDefinitionId
 * @property {boolean} hasDraft
 * @property {string|null} draftId
 * @property {string|null} updatedOn
 * @property {boolean} isPublished
 * @property {boolean} hasUnpublishedChanges
 */

/**
 * @param {Object} raw
 * @returns {WorkflowDefinitionRow}
 */
export function mapDefinitionRow(raw) {
  const activeVersion = raw.activeVersion ?? null;
  const latestVersion = raw.latestVersion ?? null;
  const hasDraft = raw.hasDraft === true;

  return {
    code:                  raw.code,
    name:                  raw.name,
    description:           raw.description ?? null,
    targetTypeKey:         raw.targetTypeKey ?? null,
    triggerTypeKey:        raw.triggerTypeKey ?? null,
    latestVersion,
    activeVersion,
    activeDefinitionId:    raw.activeDefinitionId ?? null,
    hasDraft,
    draftId:               raw.draftId ?? null,
    updatedOn:             raw.updatedOn ?? null,
    isPublished:           raw.activeDefinitionId != null,
    hasUnpublishedChanges: hasDraft,
  };
}

/**
 * @param {Object} raw
 */
export function mapDefinition(raw) {
  return {
    id:            raw.id,
    code:          raw.code,
    name:          raw.name,
    description:   raw.description ?? null,
    targetTypeKey: raw.targetTypeKey ?? null,
    version:       raw.version ?? null,
    isActive:      raw.isActive === true,
    isDraft:       raw.isDraft === true,
    stamp:         raw.stamp ?? null,
    trigger:       raw.trigger ?? null,
    variables:     raw.variables ?? [],
    graph:         raw.graph ?? { startStageId: null, stages: [] },
  };
}

/**
 * @param {Object} raw
 */
export function mapVersionRow(raw) {
  return {
    definitionId:        raw.definitionId,
    version:             raw.version ?? null,
    isActive:            raw.isActive === true,
    isDraft:             raw.isDraft === true,
    stamp:               raw.stamp ?? null,
    savedByName:         raw.savedByName ?? null,
    savedOn:             raw.savedOn ?? null,
    createdOn:           raw.createdOn ?? null,
    hasRunningInstances: raw.hasRunningInstances === true,
  };
}

const either = (raw, name) => raw?.[name] ?? raw?.[name.charAt(0).toUpperCase() + name.slice(1)];

/**
 * @param {Object} raw
 * @returns {{ area: string, stageId: string|null, stepId: string|null, transitionIndex: number|null, variableName: string|null, message: string, errorCode: string|null }}
 */
export function mapProblem(raw) {
  return {
    area:            either(raw, 'area') ?? 'workflow',
    stageId:         either(raw, 'stageId') ?? null,
    stepId:          either(raw, 'stepId') ?? null,
    transitionIndex: either(raw, 'transitionIndex') ?? null,
    variableName:    either(raw, 'variableName') ?? null,
    message:         either(raw, 'message') ?? '',
    errorCode:       either(raw, 'errorCode') ?? null,
  };
}

export function mapBlockedRun(raw) {
  return {
    instanceId: either(raw, 'instanceId') ?? null,
    stageId:    either(raw, 'stageId') ?? null,
    stageTitle: either(raw, 'stageTitle') ?? null,
  };
}

/**
 * @param {Object} raw
 */
export function mapField(raw) {
  return {
    name:       raw.name,
    label:      raw.label ?? raw.name,
    typeKey:    raw.typeKey ?? null,
    filterable: raw.filterable === true,
    operators:  raw.operators ?? [],
    isUser:     raw.isUser === true,
    fillable:   raw.fillable === true,
    mustBeAskedWith: Array.isArray(raw.mustBeAskedWith) ? raw.mustBeAskedWith : [],
    itemFields: Array.isArray(raw.itemFields) ? raw.itemFields.map(mapField) : [],
  };
}

export function mapEvent(raw) {
  return {
    name:          raw.name,
    targetTypeKey: raw.targetTypeKey ?? null,
    description:   raw.description ?? null,
    displayName:   raw.displayName ?? null,
  };
}

export function mapAction(raw) {
  return {
    key:         raw.key,
    label:       raw.label ?? raw.key,
    description: raw.description ?? null,
    inputs:      (raw.inputs ?? []).map(mapActionInput),
  };
}

export function mapActionInput(raw) {
  return {
    name:     raw.name,
    label:    raw.label ?? raw.name,
    typeKey:  raw.typeKey ?? 'text',
    required: raw.required === true,
    acceptsPlaceholders: raw.acceptsPlaceholders === true,
    choices: (raw.choices ?? []).map((c) => ({ value: String(c.value), label: c.label ?? String(c.value) })),
  };
}

export function mapTargetType(raw) {
  return {
    key:   raw.key,
    value: raw.value,
  };
}
