/**
 * Reading a single run.
 *
 * The three things `GetInstance` carries that a list row cannot, pulled out of
 * the screen so they can be tested: why a cancelled run stopped, how far a
 * parallel step has got, and whether the run is standing somewhere it did not
 * choose to be.
 */

import { INSTANCE_STATUS, TASK_STATUS } from '@/constants/workflow';

/**
 * Why a cancelled run stopped.
 *
 * **A cancelled run never explains itself from its own fields.** `failureReason`
 * is null — nothing failed — so the reason lives in the last history row, and
 * without it a `Cancelled` badge is a dead end. It is one of two things:
 *
 *   - somebody stopped it, and this is the reason they typed;
 *   - its subject was deleted, and the engine wrote that.
 *
 * The second is the one that surprises people, because a to-do vanishes from
 * somebody's list without them doing anything.
 *
 * Walks backwards rather than reading `history.at(-1)`: the last row is the
 * cancellation, but a row with no note would otherwise read as "no reason
 * given" when an earlier one holds it.
 *
 * **History is a separate fetch** since 2026-09-13 — it came off `GetInstance`
 * — so it is passed in rather than read off the run. That also means the caller
 * has to know the difference between "no reason recorded" and "the history has
 * not arrived yet", which is why an empty list returns null and the screen
 * checks `historyLoaded` before saying either.
 */
export function cancellationReason(instance, history = []) {
  if (instance?.statusKey !== INSTANCE_STATUS.CANCELLED) return null;

  for (let i = history.length - 1; i >= 0; i -= 1) {
    const note = history[i]?.notes;
    if (typeof note === 'string' && note.trim()) return note.trim();
  }
  return null;
}

/**
 * A run's tasks, in the order somebody reading the run cares about.
 *
 * Open first, because they are the only ones anybody can still act on; then
 * everything settled, newest first, which is the order a person reconstructs
 * events in — "what just happened" before "what happened at the start".
 *
 * A **cancelled** task is not a failure and should not read as one: a stage
 * deadline firing, or a `joinWhen` closing a parallel block, withdraws every
 * to-do still open inside it. That is the engine working, and it is exactly the
 * case that left no trace at all before these rows existed.
 */
export function groupTasks(tasks = []) {
  const open = [];
  const settled = [];

  for (const task of tasks) {
    if (task?.statusKey === TASK_STATUS.PENDING) open.push(task);
    else settled.push(task);
  }

  settled.sort((a, b) => {
    const at = a?.completedOn ? Date.parse(a.completedOn) : 0;
    const bt = b?.completedOn ? Date.parse(b.completedOn) : 0;
    return bt - at;
  });

  return { open, settled, total: open.length + settled.length };
}

/**
 * How far a `parallel` step has got.
 *
 * `branches` maps a branch id to the step it is waiting on, and **null means
 * that branch is done** — so the count of nulls is the progress. Absent or
 * empty means the run is not inside a parallel step at all, which is not the
 * same as "no branches finished" and must not render as 0 of 0.
 */
export function branchProgress(branches) {
  const entries = Object.entries(branches ?? {});
  if (entries.length === 0) return null;

  const waiting = entries
    .filter(([, stepId]) => stepId != null)
    .map(([id, stepId]) => ({ id, stepId }));

  return { total: entries.length, done: entries.length - waiting.length, waiting };
}

/**
 * The run is in two places at once.
 *
 * Set only while a run has walked away from a to-do it will come back for — an
 * `overdue` escalation with `comeBack`. It is standing in the escalation stage
 * AND still owed an answer on the to-do it left, and whoever acts first decides
 * what happens.
 *
 * Without saying so, a run parked in one stage while a live to-do points at
 * another reads as a bug rather than as the feature working.
 */
export function returnPath(instance) {
  if (!instance?.returnStageId) return null;

  return {
    stageId: instance.returnStageId,
    stageTitle: instance.returnStageTitle || instance.returnStageId,
    stepId: instance.returnStepId ?? null,
  };
}

/**
 * What the run is about, as text.
 *
 * `targetIds` is a set as of 2026-09-13 — one run over many records, not one
 * run each — so the count is worth saying out loud where there is more than
 * one, because cancelling it stops all of them.
 */
export function describeTargets(targetIds) {
  const ids = (targetIds ?? []).filter(Boolean);
  if (ids.length === 0) return null;
  if (ids.length === 1) return { count: 1, ids, summary: ids[0] };
  return { count: ids.length, ids, summary: `${ids.length} records, in one run` };
}

/**
 * Whether a run is still going — running, paused or faulted. A faulted run has
 * stopped moving, but it is not over: it is waiting on somebody to resume it,
 * and is the run anybody looking at the record most needs to see.
 */
export function isLiveRun(run) {
  return run?.statusKey === INSTANCE_STATUS.RUNNING
    || run?.statusKey === INSTANCE_STATUS.PAUSED
    || run?.statusKey === INSTANCE_STATUS.FAULTED;
}

const startedAt = (run) => (run?.startedOn ? Date.parse(run.startedOn) || 0 : 0);

/**
 * Every run on one record, one group per workflow.
 *
 * A record can be in several workflows at once — an approval AND a payment
 * chase on the same invoice — so "the latest run" is a question per workflow,
 * not per record. Each group leads with the run that matters:
 *
 *   - the one still going, when there is one — labelled current;
 *   - otherwise the newest — labelled latest.
 *
 * Everything else in the group is earlier history, newest first.
 *
 * Groups with a run still going come first, since those are the ones somebody
 * may need to act on; then the rest, by whichever moved most recently.
 *
 * Sorted here rather than trusted from the server: the rows arrive newest
 * first, but "older runs" are appended a page at a time, and the order has to
 * hold across however many pages have been loaded.
 *
 * @param {Array} runs rows from GetInstances
 * @returns {Array<{ code: string|null, headline: Object, isCurrent: boolean, earlier: Object[] }>}
 */
export function groupRunsByWorkflow(runs = []) {
  const byCode = new Map();
  for (const run of runs) {
    const code = run?.definitionCode ?? null;
    if (!byCode.has(code)) byCode.set(code, []);
    byCode.get(code).push(run);
  }

  const groups = [...byCode.entries()].map(([code, list]) => {
    const newestFirst = [...list].sort((a, b) => startedAt(b) - startedAt(a));
    const live = newestFirst.find(isLiveRun) ?? null;
    const headline = live ?? newestFirst[0];
    return {
      code,
      headline,
      isCurrent: live !== null,
      earlier: newestFirst.filter((run) => run !== headline),
    };
  });

  return groups.sort((a, b) =>
    (Number(b.isCurrent) - Number(a.isCurrent)) || (startedAt(b.headline) - startedAt(a.headline)));
}
