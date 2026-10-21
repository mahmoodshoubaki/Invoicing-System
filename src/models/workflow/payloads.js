/** Request bodies for saving definitions and acting on runs and tasks. */

/**
 * Body for SaveDefinition — which writes the workflow's ONE draft (2026-10-11).
 *
 * `code: null` creates a brand-new workflow, and the database generates the
 * code on first save, so read it off the response and keep it. A save never
 * makes a version; PublishDefinition does.
 *
 * `stamp` is the draft's stamp as it was read, or null when there was no
 * draft. A different one is 409 WF-052: somebody else saved, published or
 * discarded the draft in between.
 *
 * @param {Object} data
 * @param {string|null} [data.code]
 * @param {number|null} [data.stamp]
 */
export function createDefinitionPayload({
  code = null,
  stamp = null,
  name,
  description = '',
  targetTypeKey,
  trigger,
  variables = [],
  graph,
}) {
  return {
    code,
    stamp,
    name,
    description,
    targetTypeKey,
    trigger,
    variables,
    graph,
  };
}

/**
 * Body for StartInstance.
 *
 * **`targetIds` is an array, and the singular `targetId` is gone** — deleted
 * from the contract on 2026-09-13, not deprecated. Several ids make **one run
 * over the set**, not one run each, which is the thing to say on any screen
 * that collects them: somebody selecting fourteen invoices is starting one
 * workflow, and stopping it stops all fourteen.
 *
 * Empty for a workflow that tracks nothing, non-empty for one that does.
 * Either way round is WF-017.
 *
 * Ids are trimmed and blanks dropped here rather than at the caller, so a
 * trailing separator in a typed list cannot send an empty id the server then
 * has to reject.
 */
export function createStartInstancePayload({ code, targetIds = [], inputs = {}, values = {} }) {
  return {
    code,
    targetIds: (targetIds ?? []).map((id) => String(id ?? '').trim()).filter(Boolean),
    inputs,
    values,
  };
}

/** Body for AdvanceInstance. Safe to send twice — a run waiting on a person does not move. */
export function createAdvanceInstancePayload({ instanceId, values = {} }) {
  return { instanceId, values };
}

/**
 * Body for ResumeInstance — the way back from Faulted.
 *
 * Advancing a faulted run is a no-op that still answers 200, so this is not an
 * alternative to advance; it is the only thing that moves one. Faulted runs
 * only: anything else is WF-045.
 *
 * `resetStepCount` is deliberately NOT folded into the ordinary resume. It only
 * applies to a run the loop guard stopped, and the count is what stops a
 * genuinely runaway workflow — so it is a second, separate confirmation, and
 * the reset is written into the run's history with the number it was at.
 *
 * Raising `MaxStepsPerInstance` comes first if the workflow really is that
 * long: resetting under an unchanged ceiling just buys the same steps again.
 */
export function createResumeInstancePayload({ instanceId, notes = null, resetStepCount = false, variableChanges = null }) {
  const body = { instanceId, resetStepCount: resetStepCount === true };
  // Optional, and lands in the run's history — so an empty box is not sent as
  // an empty note.
  if (notes?.trim()) body.notes = notes.trim();
  // The values corrected first (2026-10-21) — only the changed ones, name →
  // text, null to clear. One wrong value refuses them all (WF-058).
  if (variableChanges && Object.keys(variableChanges).length > 0) body.variableChanges = variableChanges;
  return body;
}

/**
 * Body for CancelInstance — stopping a run for good.
 *
 * **There is no undo.** A cancelled run cannot be resumed; it can only be
 * started again from the beginning, losing everything it had done. It also
 * withdraws every to-do the run was still asking, so the to-dos disappear out
 * of other people's lists without them doing anything.
 *
 * `reason` is trimmed and sent as given. It is **not optional here**, though
 * the endpoint would accept an empty one: the reason is written into the run's
 * history and is the ONLY thing a cancelled run can ever say for itself —
 * `failureReason` stays null because nothing failed. A cancellation with no
 * reason is a permanent dead end for whoever finds it later.
 *
 * Running runs, and since 2026-10-21 Faulted ones — stopping a faulted run
 * is how it lets go of the records it holds. Anything else is WF-001.
 */
export function createCancelInstancePayload({ instanceId, reason }) {
  return { instanceId, reason: String(reason ?? '').trim() };
}

/**
 * Body for PauseInstance — stopping a run on purpose, reversibly.
 *
 * The counterpart to Cancel, and the difference is the whole point: a paused
 * run is picked back up by `ResumeInstance`, a cancelled one can only be
 * started again from the beginning.
 *
 * `reason` is **required** by the server — an empty one comes back 400 — and it
 * is required here for the same reason it is on Cancel: it is written into the
 * run's history, and a run somebody finds stopped with no explanation is a dead
 * end for them.
 *
 * Guarded by `WorkflowInstances.Cancel` — the **same** permission as cancel,
 * confirmed 2026-09-13. So the two are one decision to grant: anybody who may
 * hold a run may also end it. Worth knowing before treating Pause as the softer
 * option to hand out more widely; it is not separately grantable.
 */
export function createPauseInstancePayload({ instanceId, reason }) {
  return { instanceId, reason: String(reason ?? '').trim() };
}

/**
 * Body for ReassignTask — handing an open to-do to somebody else.
 *
 * **The to-do gets a new id.** The old one closes as `Reassigned` (task status
 * 4, *not* Cancelled) and a replacement takes its place on the same step,
 * keeping the title, the due date and the escalation clock — a handover is the
 * same piece of work, so its deadline does not restart. Callers must therefore
 * **re-read the list** rather than patching the row they were looking at.
 *
 * At least one user or role, or `WF-006`; the to-do must still be pending, or
 * `WF-005`. Ids are de-duplicated because naming somebody twice is a typo, not
 * an instruction.
 */
export function createReassignTaskPayload({ instanceId, taskId, toUserIds = [], toRoleIds = [] }) {
  return {
    instanceId,
    taskId,
    toUserIds: [...new Set((toUserIds ?? []).filter(Boolean))],
    toRoleIds: [...new Set((toRoleIds ?? []).filter(Boolean))],
  };
}

/** Body for CompleteTask. */
export function createCompleteTaskPayload({ instanceId, taskId, outcomeKey, comment = null, values = {} }) {
  return { instanceId, taskId, outcomeKey, comment, values };
}

/**
 * CompleteTaskWithFiles (2026-10-13), for a task with a `files` field: the same
 * body as CompleteTask as JSON in `Request`, and each new file as its own part
 * NAMED AFTER ITS FIELD (`attachments`) — the server matches the name exactly.
 * Files to delete are not parts: they ride in `values` as text.
 *
 * @param {Object} args  as createCompleteTaskPayload
 * @param {Object<string, Array<{ file: File, name: string }>>} filesByField
 * @returns {FormData}
 */
export function createCompleteTaskWithFilesFormData(args, filesByField = {}) {
  const formData = new FormData();
  formData.append('Request', JSON.stringify(createCompleteTaskPayload(args)));
  for (const [fieldName, files] of Object.entries(filesByField)) {
    for (const entry of files ?? []) formData.append(fieldName, entry.file, entry.name);
  }
  return formData;
}
