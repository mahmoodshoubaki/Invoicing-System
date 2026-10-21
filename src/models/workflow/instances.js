/** Response mappers for runs, their history, and people's tasks. */

import { ASSIGNEE_TYPE } from '@/constants/workflow';

/**
 * @typedef {Object} WorkflowInstance
 * @property {string}       instanceId
 * @property {string}       definitionCode
 * @property {number}       definitionVersion
 * @property {number}       statusKey
 * @property {string}       status
 * @property {string|null}  currentStageId
 * @property {string|null}  currentStageTitle
 * @property {string|null}  currentStepId
 * @property {string|null}  failureReason      - render verbatim; written for a person
 * @property {string|null}  delayUntil         - set while the run sleeps on a delay step
 * @property {string|null}  stageDeadlineOn    - set while the stage's deadline is armed
 * @property {Object}       branches           - branchId → the step it waits on, null when done
 * @property {Array}        pendingTasks
 * @property {Array}        history
 */

/**
 * The shared response of StartInstance, AdvanceInstance, GetInstance and
 * CompleteTask.
 *
 * The three clocks are all null/empty unless they apply, and they mean
 * different things on screen: `delayUntil` is a run that is *asleep*,
 * `stageDeadlineOn` is one that will *escalate*, and neither is the same as a
 * run merely waiting on a person.
 *
 * @param {Object} raw
 * @returns {WorkflowInstance|null}
 */
/**
 * Who a to-do is assigned to RIGHT NOW.
 *
 * **These have to come from the task record, not from the definition.** The
 * definition says who a step was *configured* for, which is wrong in the three
 * cases that matter: an `assignToExpressions` entry like `{{submittedBy}}` only
 * resolves when the run gets there, a handed-on to-do belongs to whoever it was
 * handed to, and a deactivated person is still in the definition. Only the
 * server knows the current answer.
 *
 * Read from `assignees` (2026-10-01), one list on both GetMyTasks and
 * GetInstanceTasks rows: `{ assigneeTypeKey: 1 user | 2 role, assigneeId, name }`.
 * Split here into users and roles, the shape the screens draw. A name is null
 * for an account or role that no longer exists; those are left out rather
 * than shown as a guid.
 *
 * `reassignedToName` is on a Reassigned row only: whoever it was handed to,
 * already joined into one line ("Ali Hassan, Finance"). Null on every other
 * row, and on to-dos reassigned before the backend kept the link.
 */
function mapAssignees(raw) {
  const named = (typeKey) => (raw?.assignees ?? [])
    .filter((a) => a?.assigneeTypeKey === typeKey && a.name)
    .map((a) => ({ id: a.assigneeId ?? null, name: a.name }));

  return {
    assignedUsers: named(ASSIGNEE_TYPE.USER),
    assignedRoles: named(ASSIGNEE_TYPE.ROLE),
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
    // The project the run's records belong to. Dropped here until 2026-10-21,
    // so the run page could not link a BOQ item or a change request — both
    // live under their project — nor show the project itself.
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

/**
 * One row from **GetInstanceTasks** — every task a run has created, whatever
 * became of it.
 *
 * This is the endpoint that made a run's audit trail possible: until it existed
 * the only task data was the *pending* list, so a screen could say what a run
 * was waiting for but not what anybody had already decided.
 *
 * `statusKey` is the `taskStatus` enum — 1 Pending, 2 Completed, 3 Cancelled,
 * 4 Reassigned. A cancelled one is not a failure: a stage deadline firing or a
 * `joinWhen` closing a parallel block withdraws every to-do still open inside
 * it, which is exactly the case that used to vanish without trace.
 */
export function mapInstanceTaskRow(raw) {
  return {
    taskId:      raw.taskId,
    stepId:      raw.stepId ?? null,
    title:       raw.title ?? null,
    dueOn:       raw.dueOn ?? null,
    statusKey:   raw.statusKey ?? null,
    status:      raw.status ?? null,
    // What the answer WAS, as opposed to `outcomes`, which is what the answers
    // could have been. Only one of the two is ever on a row.
    outcome:     raw.outcome ?? raw.outcomeKey ?? null,
    outcomes:    raw.outcomes ?? [],
    comment:     raw.comment ?? null,

    // `completedBy` is the id; `completedByName` is the person. Render the
    // name — a guid on screen is noise, and showing it "because we have
    // something" is how a screen ends up displaying a database key to a user.
    completedBy:     raw.completedBy ?? null,
    completedByName: raw.completedByName ?? null,

    completedOn: raw.completedOn ?? null,

    // Who it is assigned to — shown whatever its status, since for a pending
    // task it is who can answer, and for a settled one it is who could have.
    // See mapAssignees for why this cannot be read off the definition.
    ...mapAssignees(raw),
  };
}

/**
 * One of a run's values, from **GetInstanceVariables** (2026-10-21) — what the
 * run is working from right now: its declared variables, its start-form
 * answers, and whatever its steps put there (a query's found rows, a loop's
 * item). `type` is the declared type, null for one nothing declares; `value`
 * is the raw JSON value — text, a number, a list, fields, or null.
 */
export function mapInstanceVariable(raw) {
  return {
    name: raw?.name ?? '',
    type: raw?.type ?? null,
    value: raw?.value === undefined ? null : raw.value,
  };
}

/** A pending to-do carried on the instance response. */
export function mapInstanceTask(raw) {
  return {
    taskId:   raw.taskId,
    stepId:   raw.stepId ?? null,
    title:    raw.title ?? null,
    dueOn:    raw.dueOn ?? null,
    outcomes: raw.outcomes ?? [],
  };
}

/** One audit-trail entry. Enough to render a timeline with no second call. */
export function mapHistoryRow(raw) {
  return {
    fromStageId:    raw.fromStageId ?? null,
    fromStageTitle: raw.fromStageTitle ?? null,
    toStageId:      raw.toStageId ?? null,
    toStageTitle:   raw.toStageTitle ?? null,
    toStatusKey:    raw.toStatusKey ?? null,
    performedOn:    raw.performedOn ?? null,

    /*
     * Who moved the run — added 2026-09-13.
     *
     * **An empty `performedBy` is a fact, not a gap.** Most rows on a timeline
     * are the engine's own work: a stage deadline firing, a delay waking up, a
     * `queueAndRetry` step coming back. Those have no person behind them, and a
     * screen that says "by —" for them is worse than one that says the engine
     * did it.
     *
     * `performedBy` is the id and `performedByName` is what a reader sees. The
     * id is kept for linking later; it must never be rendered on its own, as a
     * guid tells a reader nothing at all.
     */
    performedBy:     raw.performedBy ?? null,
    performedByName: raw.performedByName ?? null,

    notes:          raw.notes ?? null,

    // The tracking number of the action that moved the run — what the trace
    // page is asked about (2026-10-07). Null for rows from before tracking.
    correlationId:  raw.correlationId ?? null,
  };
}

/**
 * One row from GetInstances. Carries two of the three clocks — `branches` is
 * deliberately not on the list row.
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
    // An array since 2026-09-13 — a run is about a SET. A run about one thing
    // has a one-item array, so the single case is `targetIds[0]`; there is no
    // scalar `targetId` to fall back to and reading one gets undefined.
    targetIds:         raw.targetIds ?? [],
    // What kind of record the ids are. On the row all along, and dropped here
    // until 2026-10-13 — the list then guessed it from the workflows list,
    // which is only loaded once somebody opens Workflows, so its links went
    // missing. 0 is no kind at all.
    targetTypeKey:     raw.targetTypeKey > 0 ? raw.targetTypeKey : null,
    startedOn:         raw.startedOn ?? null,
    completedOn:       raw.completedOn ?? null,
    projectCode:       raw.projectCode ?? null,
    // On the list row as of 2026-09-13. It used to be single-run-only, which
    // meant the monitoring list could show a faulted run without saying why,
    // and the Resume dialog had to fetch the whole run just to decide whether
    // the loop-guard reset applied. Both of those go away.
    failureReason:     raw.failureReason ?? null,
    delayUntil:        raw.delayUntil ?? null,
    stageDeadlineOn:   raw.stageDeadlineOn ?? null,
    pendingTaskCount:  raw.pendingTaskCount ?? 0,
  };
}

/**
 * One row from GetMyTasks — fills the whole My Tasks screen in one call.
 *
 * `buttons` and `canAct` are authored by whoever drew the workflow, not by us:
 * render the buttons literally (key, label, colour, comment rule) and show a
 * `canAct: false` row read-only rather than hiding it.
 *
 * @param {Object} raw
 */
export function mapMyTask(raw) {
  return {
    taskId:            raw.taskId,
    instanceId:        raw.instanceId,
    stepId:            raw.stepId ?? null,
    title:             raw.title ?? null,
    // When the to-do was created. Both spellings are read: data rows so far
    // have been camelCase, but this API's error bodies arrive PascalCase
    // (`ErrorCode`, `Message`), and the field was handed over as `CreatedOn`,
    // so the casing is not safe to assume.
    createdOn:         raw.createdOn ?? raw.CreatedOn ?? null,
    dueOn:             raw.dueOn ?? null,
    isOverdue:         raw.isOverdue === true,
    definitionCode:    raw.definitionCode ?? null,
    definitionName:    raw.definitionName ?? null,
    definitionVersion: raw.definitionVersion ?? null,
    currentStageId:    raw.currentStageId ?? null,
    currentStageTitle: raw.currentStageTitle ?? null,
    canAct:            raw.canAct === true,

    /*
     * The status of the RUN this to-do belongs to — not the to-do's own.
     *
     * A **paused** run keeps its to-dos in people's lists, but `CompleteTask`
     * refuses them with WF-001. Without this the row looks answerable, the
     * click fails, and the only way to learn why is to read an error.
     *
     * ⚠ **Not documented on `MyTaskRow` today**, so this reads as null and the
     * UI falls back to handling the refusal. It is here so the day the field
     * arrives the rows explain themselves with no further change — and so the
     * name to add is written down. Two spellings accepted because the obvious
     * one is ambiguous on a row that also has a task status.
     */
    runStatusKey:      raw.runStatusKey ?? raw.instanceStatusKey ?? null,

    /*
     * The to-do's OWN status. `GetMyTasks` is documented as returning pending
     * to-dos only, so absent is read as pending — a row with no status is one
     * that can still be answered, not one of unknown state. It matters because
     * the list has a Completed filter, and a settled row must never be offered
     * outcome buttons.
     */
    statusKey:         raw.statusKey ?? null,

    // The project an invoice or BOQ workflow belongs to; null otherwise.
    projectCode:       raw.projectCode ?? null,

    // What the task's run is about (2026-10-13), as on a run's row: the kind of
    // record, and which ones. 0 is no kind at all.
    targetTypeKey:     raw.targetTypeKey > 0 ? raw.targetTypeKey : null,
    targetIds:         raw.targetIds ?? [],

    // Who it is assigned to right now. See mapAssignees.
    ...mapAssignees(raw),

    buttons:           (raw.buttons ?? []).map(mapTaskButton),

    // What the task's holder fills in on the record (2026-10-11), each with its
    // current value as text — see lib/taskFieldValues. Empty for most tasks.
    fields:            (raw.fields ?? []).map(mapTaskField),
  };
}

/** One server-authored action button on a task. */
export function mapTaskButton(raw) {
  return {
    key:             raw.key,
    label:           raw.label ?? raw.key,
    requiresComment: raw.requiresComment === true,
    // Pressing it saves the task's fields, so its required ones must be filled.
    requiresFields:  raw.requiresFields === true,
    colorHex:        raw.colorHex ?? null,
  };
}

/** One box of a task's form: the record's field, its type, and what it holds now. */
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
