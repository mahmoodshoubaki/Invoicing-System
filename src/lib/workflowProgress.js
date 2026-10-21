/**
 * Where a record is in the workflow deciding it, as stepper steps
 * (2026-10-21) — shared by change requests, invoices and BOQ items. Each record
 * adds its own first step (raised, submitted) and last one (its outcome); the
 * steps between are the workflow's, read here:
 *
 * - its stages (Workflows.View), in the order a run meets them — from the
 *   start, each stage's first way out first — and only the ones a run can
 *   reach, or this one did. What is next is read from the current stage's
 *   transitions, so a stage that can lead two ways says both. Once the record
 *   is settled, only the stages it went through, in the order it went;
 * - without the stages, the run's history (WorkflowInstances.View): the
 *   stages passed and the one it is on;
 * - with neither, one step standing for the whole workflow.
 */

import { INSTANCE_STATUS } from '@/constants/workflow';
import { isLiveRun } from '@/lib/runDetail';

export const STEP = {
  DONE: 'done',
  CURRENT: 'current',
  NEXT: 'next',
  UPCOMING: 'upcoming',
};

/** How a step reads beyond its state — an outcome, or a run in trouble. */
export const TONE = {
  GOOD: 'good',
  BAD: 'bad',
  NEUTRAL: 'neutral',
  WARNING: 'warning',
};

const startedAt = (run) => Date.parse(run?.startedOn ?? '') || 0;

/** The run a record's progress follows: the live one, or else the latest. */
export function pickRun(runs) {
  const list = [...(runs ?? [])].sort((a, b) => startedAt(b) - startedAt(a));
  return list.find(isLiveRun) ?? list[0] ?? null;
}

/**
 * Where a stage can lead: the stages its transitions go to (itself left out),
 * and whether one of them ends the run. A stage with no transition ends it.
 */
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

/**
 * The stages a run can reach, in the order it meets them: from the start
 * stage, each stage's transitions in their order (the way forward is usually
 * written first), then its deadline's stage.
 */
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

/** "A", "A or B", "A, B or C". */
function either(titles) {
  if (titles.length <= 1) return titles.join('');
  return `${titles.slice(0, -1).join(', ')} or ${titles.at(-1)}`;
}

const capitalised = (text) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/** The stages a run has been through, in the order it went, from its history. */
function visitedStages(history) {
  const rows = [...(history ?? [])].sort((a, b) => (Date.parse(a.performedOn ?? '') || 0) - (Date.parse(b.performedOn ?? '') || 0));
  const seen = new Map();
  for (const row of rows) {
    if (row.fromStageId && !seen.has(row.fromStageId)) seen.set(row.fromStageId, row.fromStageTitle || row.fromStageId);
    if (row.toStageId && !seen.has(row.toStageId)) seen.set(row.toStageId, row.toStageTitle || row.toStageId);
  }
  return seen;
}

/** How the stage a run stands on reads: stopped on an error, paused, or just waiting. */
function currentTone(run) {
  if (run?.statusKey === INSTANCE_STATUS.FAULTED) return { tone: TONE.BAD, note: 'Stopped on an error — an admin can resume it' };
  if (run?.statusKey === INSTANCE_STATUS.PAUSED) return { tone: TONE.WARNING, note: 'Paused' };
  return { tone: null, note: null };
}

/**
 * The workflow's steps of a record's stepper.
 *
 * @param {{
 *   run?: Object|null, history?: Array, graph?: Object|null,
 *   settled: boolean,  the record has its outcome — only the path it took is shown
 *   fallback: { title: string, note?: string|null, next?: string|null },  the one step without the workflow
 *   endName?: string,  what the run ending leads to, in "Next: … or the decision"
 * }} input
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
    // The stages: passed, the one it stands on, where it can go next, the rest it can reach.
    const currentId = run.currentStageId;
    const exits = currentId ? stageExits(graph, currentId) : null;
    const nextIds = new Set(exits?.stageIds ?? []);
    const { tone, note } = currentTone(run);
    const reachable = flowOrder(graph);
    const inFlow = new Set(reachable.map((s) => s.id));
    // A stage nothing leads to (an escalation reached some other way) shows only once it matters.
    const extra = stages.filter((s) => !inFlow.has(s.id) && (visited.has(s.id) || s.id === currentId || nextIds.has(s.id)));
    const shown = [...reachable, ...extra];
    for (const stage of shown) {
      const title = stage.title || stage.id;
      if (stage.id === currentId) steps.push({ key: `stage:${stage.id}`, title, state: STEP.CURRENT, tone, note });
      // Next even when it was passed before — a record sent back goes round again.
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
    // No access to the workflow itself: the stages the run has been through, and the one it is on.
    const currentId = live ? run.currentStageId : null;
    const { tone, note } = currentTone(run);
    for (const [id, title] of visited) {
      if (id !== currentId) steps.push({ key: `stage:${id}`, title, state: STEP.DONE });
    }
    if (live) {
      steps.push({ key: `stage:${currentId ?? 'current'}`, title: run.currentStageTitle || fallback.title, state: STEP.CURRENT, tone, note });
    }
  } else {
    // Nothing of the workflow to read: one step for all of it.
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
 * A record's whole stepper: its first step, the workflow's, and its outcome —
 * done once settled, next when the run's current stage can end it.
 *
 * @param {Object} first  a done step
 * @param {ReturnType<typeof workflowSteps>} middle
 * @param {{ key: string, title: string, note?: string|null, tone?: string|null, done: boolean }} last
 */
export function assembleSteps(first, middle, last) {
  const { done, ...step } = last;
  const end = { ...step, state: done ? STEP.DONE : middle.endsNext ? STEP.NEXT : STEP.UPCOMING };
  return { steps: [first, ...middle.steps, end], next: middle.next };
}
