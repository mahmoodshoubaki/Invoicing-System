import { INSTANCE_STATUS, TASK_STATUS } from '@/constants/workflow';

export function cancellationReason(instance, history = []) {
  if (instance?.statusKey !== INSTANCE_STATUS.CANCELLED) return null;

  for (let i = history.length - 1; i >= 0; i -= 1) {
    const note = history[i]?.notes;
    if (typeof note === 'string' && note.trim()) return note.trim();
  }
  return null;
}

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

export function branchProgress(branches) {
  const entries = Object.entries(branches ?? {});
  if (entries.length === 0) return null;

  const waiting = entries
    .filter(([, stepId]) => stepId != null)
    .map(([id, stepId]) => ({ id, stepId }));

  return { total: entries.length, done: entries.length - waiting.length, waiting };
}

export function returnPath(instance) {
  if (!instance?.returnStageId) return null;

  return {
    stageId: instance.returnStageId,
    stageTitle: instance.returnStageTitle || instance.returnStageId,
    stepId: instance.returnStepId ?? null,
  };
}

export function describeTargets(targetIds) {
  const ids = (targetIds ?? []).filter(Boolean);
  if (ids.length === 0) return null;
  if (ids.length === 1) return { count: 1, ids, summary: ids[0] };
  return { count: ids.length, ids, summary: `${ids.length} records, in one run` };
}

export function isLiveRun(run) {
  return run?.statusKey === INSTANCE_STATUS.RUNNING
    || run?.statusKey === INSTANCE_STATUS.PAUSED
    || run?.statusKey === INSTANCE_STATUS.FAULTED;
}

const startedAt = (run) => (run?.startedOn ? Date.parse(run.startedOn) || 0 : 0);

/**
 * @param {Array} runs
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
