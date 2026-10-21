/** Response mappers for workflow definitions and their catalogs: fields, events, actions, target types. */

/**
 * @typedef {Object} WorkflowDefinitionRow
 * @property {string}      code
 * @property {string}      name
 * @property {string|null} description
 * @property {number}      targetTypeKey
 * @property {number}      triggerTypeKey
 * @property {number|null} latestVersion       - null for a workflow that exists only as a draft
 * @property {number|null} activeVersion       - null when nothing is published
 * @property {string|null} activeDefinitionId
 * @property {boolean}     hasDraft            - an unpublished draft exists (2026-10-11)
 * @property {string|null} draftId             - what editing continues from
 * @property {string|null} updatedOn           - ISO string
 * @property {boolean}     isPublished         - derived
 * @property {boolean}     hasUnpublishedChanges - derived: there is a draft
 */

/**
 * One row from GetDefinitions — a workflow, not a version.
 *
 * `isPublished` / `hasUnpublishedChanges` are derived here so the list and the
 * builder cannot disagree about what "live" means.
 *
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
    // Since drafts (2026-10-11), unpublished work IS the draft. A numbered
    // version above the live one was saved under the old rules and is just
    // another version that can be made live.
    hasUnpublishedChanges: hasDraft,
  };
}

/**
 * GetDefinition — the full definition. Round-trips: this body feeds straight
 * back into SaveDefinition, so `trigger`, `variables` and `graph` are passed
 * through untouched rather than normalised. Reshaping them here would be a
 * silent way to corrupt a workflow somebody else authored.
 *
 * Without a version it is what editing continues from: the draft, else the
 * live version, else the newest. A draft has `version: null` and a `stamp`
 * that the next save sends back.
 *
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
 * One row from GetDefinitionVersions. `hasRunningInstances` gates rollback.
 *
 * The draft, when there is one, is the first row: `isDraft`, `version: null`,
 * its `stamp`, and who saved it when — so the builder can warn before a save
 * from an older version replaces somebody's unpublished work.
 *
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

/** Reads a field from a body that may be camelCase (a reply) or PascalCase (an error). */
const either = (raw, name) => raw?.[name] ?? raw?.[name.charAt(0).toUpperCase() + name.slice(1)];

/**
 * One problem with a workflow, and where it is (2026-10-11) — from SaveDefinition's
 * reply, or from a publish refused with WF-053. The ids that do not apply to
 * its `area` are null.
 *
 * @param {Object} raw
 * @returns {{ area: string, stageId: string|null, stepId: string|null, transitionIndex: number|null,
 *   variableName: string|null, message: string, errorCode: string|null }}
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

/** A run that stopped a publish (409 WF-024): it waits in a stage that changed. */
export function mapBlockedRun(raw) {
  return {
    instanceId: either(raw, 'instanceId') ?? null,
    stageId:    either(raw, 'stageId') ?? null,
    stageTitle: either(raw, 'stageTitle') ?? null,
  };
}

/**
 * One field from GetFields.
 *
 * `operators` arrives already narrowed to what this field's type supports —
 * `contains` is not offered on a number. Use it directly; never compute the
 * list in the front end.
 *
 * `filterable: false` means the field can be READ in a condition but not
 * SEARCHED in a query or a schedule scan.
 *
 * @param {Object} raw
 */
export function mapField(raw) {
  return {
    name:       raw.name,
    label:      raw.label ?? raw.name,
    typeKey:    raw.typeKey ?? null,
    filterable: raw.filterable === true,
    operators:  raw.operators ?? [],
    // Whether this field holds a person, so a task can be assigned to whoever
    // it names. A FLAG, not a type: `submittedBy` stays `typeKey: "text"` and
    // keeps its text operators — this only decides whether the assignee picker
    // offers it. Naming a non-user field in an expression is WF-038.
    isUser:     raw.isUser === true,
    // Whether a human task may ask for it to be filled (2026-10-11). Only these
    // are offered under a task's "Fields to fill"; any other is WF-055.
    fillable:   raw.fillable === true,
    // Fields a task must ask for together with this one (2026-10-13) — a BOQ
    // item's billing frequency and expected date both need its invoicingPlan.
    mustBeAskedWith: Array.isArray(raw.mustBeAskedWith) ? raw.mustBeAskedWith : [],
    // The columns of each row of a `list` field (2026-10-13) — an invoice's lines.
    itemFields: Array.isArray(raw.itemFields) ? raw.itemFields.map(mapField) : [],
  };
}

/** One event from GetEvents. */
export function mapEvent(raw) {
  return {
    name:          raw.name,
    targetTypeKey: raw.targetTypeKey ?? null,
    description:   raw.description ?? null,
    displayName:   raw.displayName ?? null,
  };
}

/**
 * One action from GetActions — what an `automated` step may call.
 *
 * `inputs` is what lets the editor draw a real form instead of two free-text
 * boxes. An action that describes nothing returns an empty list, and the free
 * text editor is the fallback for exactly that case.
 *
 * A `choice` input's `choices` are read live from the module's own source of
 * truth — a new invoice status appears without a redeploy — so nothing here may
 * be cached across a session.
 */
export function mapAction(raw) {
  return {
    key:         raw.key,
    label:       raw.label ?? raw.key,
    description: raw.description ?? null,
    inputs:      (raw.inputs ?? []).map(mapActionInput),
  };
}

/** One input an action declares. */
export function mapActionInput(raw) {
  return {
    name:     raw.name,
    label:    raw.label ?? raw.name,
    typeKey:  raw.typeKey ?? 'text',
    required: raw.required === true,
    // Whether `{{…}}` may be typed here as well as a literal. True on
    // everything shipped so far, but an action may say otherwise.
    acceptsPlaceholders: raw.acceptsPlaceholders === true,
    choices: (raw.choices ?? []).map((c) => ({ value: String(c.value), label: c.label ?? String(c.value) })),
  };
}

/** One row from GetTargetTypes. */
export function mapTargetType(raw) {
  return {
    key:   raw.key,
    value: raw.value,
  };
}
