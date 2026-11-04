import { INSTANCE_STATUS } from '@/constants/workflow';
import { isLiveRun } from '@/lib/runDetail';

export const STEP = {
  DONE: 'done',
  CURRENT: 'current',
  NEXT: 'next',
  UPCOMING: 'upcoming',
};

export const TONE = {
  GOOD: 'good',
  BAD: 'bad',
  NEUTRAL: 'neutral',
  WARNING: 'warning',
};

const startedAt = (run) => Date.parse(run?.startedOn ?? '') || 0;

export function pickRun(runs) {
  const list = [...(runs ?? [])].sort((a, b) => startedAt(b) - startedAt(a));
  return list.find(isLiveRun) ?? list[0] ?? null;
}

export function stageExits(graph, stageId) {
  const stage = (graph?.stages ?? []).find((s) => s.id === stageId);
  if (!stage) return null;
  const transitions = stage.transitions ?? [];
  const stageIds = [];
  let ends = transitions.length === 0;
  for (const t of transitions) {
    if (t.toStageId == null) ends = true;
    else if (t.toStageId !== stageId && !stageIds.includes(t.toStageId)) stageIds.push(t.toStageId);
  }
  return { stageIds, ends };
}

export function flowOrder(graph) {
  const stages = graph?.stages ?? [];
  const byId = new Map(stages.map((s) => [s.id, s]));
  const order = [];
  const seen = new Set();
  const walk = (id) => {
    if (id == null || seen.has(id) || !byId.has(id)) return;
    seen.add(id);
    const stage = byId.get(id);
    order.push(stage);
    for (const t of stage.transitions ?? []) walk(t.toStageId);
    walk(stage.deadline?.toStageId);
  };
  walk(graph?.startStageId ?? stages[0]?.id);
  return order;
}

function either(titles) {
  if (titles.length <= 1) return titles.join('');
  return `${titles.slice(0, -1).join(', ')} or ${titles.at(-1)}`;
}

const capitalised = (text) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

function visitedStages(history) {
  const rows = [...(history ?? [])].sort((a, b) => (Date.parse(a.performedOn ?? '') || 0) - (Date.parse(b.performedOn ?? '') || 0));
  const seen = new Map();
  for (const row of rows) {
    if (row.fromStageId && !seen.has(row.fromStageId)) seen.set(row.fromStageId, row.fromStageTitle || row.fromStageId);
    if (row.toStageId && !seen.has(row.toStageId)) seen.set(row.toStageId, row.toStageTitle || row.toStageId);
  }
  return seen;
}

function currentTone(run) {
  if (run?.statusKey === INSTANCE_STATUS.FAULTED) return { tone: TONE.BAD, note: 'Stopped on an error — an admin can resume it' };
  if (run?.statusKey === INSTANCE_STATUS.PAUSED) return { tone: TONE.WARNING, note: 'Paused' };
  return { tone: null, note: null };
}

/**
 * @param {{ run?: Object|null, history?: Array, graph?: Object|null, settled: boolean, the record has its outcome — only the path it took is shown fallback: { title: string, note?: string|null, next?: string|null }, the one step without the workflow endName?: string, what the run ending leads to, in "Next: … or the decision" }} input
 * @returns {{ steps: Array, next: string|null, endsNext: boolean }}
 */
export function workflowSteps({ run = null, history = [], graph = null, settled, fallback, endName = 'the decision' }) {
  const steps = [];
  let next = null;
  let endsNext = false;
  const live = isLiveRun(run) && !settled;
  const visited = visitedStages(history);
  const stages = graph?.stages ?? [];
  const titleOf = (id, fallbackTitle) => stages.find((s) => s.id === id)?.title || fallbackTitle || id;

  if (run && stages.length > 0 && !live && visited.size > 0) {
    // Over: the journey it took, in the order it went.
    for (const [id, title] of visited) steps.push({ key: `stage:${id}`, title: titleOf(id, title), state: STEP.DONE });
  } else if (run && stages.length > 0 && live) {
    const currentId = run.currentStageId;
    const exits = currentId ? stageExits(graph, currentId) : null;
    const nextIds = new Set(exits?.stageIds ?? []);
    const { tone, note } = currentTone(run);
    const reachable = flowOrder(graph);
    const inFlow = new Set(reachable.map((s) => s.id));
    const extra = stages.filter((s) => !inFlow.has(s.id) && (visited.has(s.id) || s.id === currentId || nextIds.has(s.id)));
    const shown = [...reachable, ...extra];
    for (const stage of shown) {
      const title = stage.title || stage.id;
      if (stage.id === currentId) steps.push({ key: `stage:${stage.id}`, title, state: STEP.CURRENT, tone, note });
      else if (nextIds.has(stage.id)) steps.push({ key: `stage:${stage.id}`, title, state: STEP.NEXT });
      else steps.push({ key: `stage:${stage.id}`, title, state: visited.has(stage.id) ? STEP.DONE : STEP.UPCOMING });
    }
    if (exits) {
      const titles = shown.filter((s) => nextIds.has(s.id)).map((s) => s.title || s.id);
      if (exits.ends) titles.push(endName);
      next = titles.length ? capitalised(either(titles)) : null;
      endsNext = exits.ends;
    }
  } else if (run && (visited.size > 0 || run.currentStageTitle)) {
    const currentId = live ? run.currentStageId : null;
    const { tone, note } = currentTone(run);
    for (const [id, title] of visited) {
      if (id !== currentId) steps.push({ key: `stage:${id}`, title, state: STEP.DONE });
    }
    if (live) {
      steps.push({ key: `stage:${currentId ?? 'current'}`, title: run.currentStageTitle || fallback.title, state: STEP.CURRENT, tone, note });
    }
  } else {
    steps.push({
      key: 'workflow',
      title: fallback.title,
      state: settled ? STEP.DONE : STEP.CURRENT,
      note: settled ? null : fallback.note ?? null,
    });
    next = fallback.next ?? null;
  }

  return { steps, next: settled ? null : next, endsNext: !settled && endsNext };
}

/**
 * @param {Object} first
 * @param {ReturnType<typeof workflowSteps>} middle
 * @param {{ key: string, title: string, note?: string|null, tone?: string|null, done: boolean }} last
 */
export function assembleSteps(first, middle, last) {
  const { done, ...step } = last;
  const end = { ...step, state: done ? STEP.DONE : middle.endsNext ? STEP.NEXT : STEP.UPCOMING };
  return { steps: [first, ...middle.steps, end], next: middle.next };
}
