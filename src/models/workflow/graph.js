/** Trigger, stage and graph builders. */

import { TRIGGER_KIND } from '@/constants/workflow';
import { readDuration, writeDuration } from '@/utils/workflowDuration';

import { createFilterGroup, isEmptyFilterGroup } from './conditions';

/** Triggers, discriminated by `kind` — same first-property discipline. */
export const createTrigger = {
  event({ eventName }) {
    return { kind: TRIGGER_KIND.EVENT, eventName };
  },

  /**
   * Scan-and-spawn: on a workflow that tracks an entity, each occurrence
   * starts one run per matching row rather than a single run. Omitting `scan`
   * matches everything. Targets already running the workflow are skipped.
   */
  schedule({ cron, scan = null }) {
    const trigger = { kind: TRIGGER_KIND.SCHEDULE, cron };
    if (scan && !isEmptyFilterGroup(scan)) trigger.scan = scan;
    return trigger;
  },

  /** `inputs` is the little form the starter fills in. */
  manual({ inputs = [] } = {}) {
    return { kind: TRIGGER_KIND.MANUAL, inputs };
  },
};

/** One variable / manual-trigger input. */
export function createVariable({ name, type, label = '', defaultValue = null, required = false }) {
  return { name, type, label: label || name, defaultValue, required };
}

/**
 * One outbound edge from a stage.
 *
 * First matching transition wins, so array order is meaningful. An empty
 * condition matches everything — that is the "otherwise" arm, and it belongs
 * last. `toStageId: null` ends the run.
 */
export function createTransition({ condition = createFilterGroup(), toStageId = null } = {}) {
  return { condition, toStageId };
}

/**
 * What happens if nobody ever acts. Deliberately NOT a transition: transitions
 * are read once a stage's steps have run out, while a deadline fires while the
 * stage is still waiting.
 *
 * `toStageId` is required here, unlike a transition's — a stage nobody
 * answered in time must not finish quietly. Pointing it back at its own stage
 * is legal and means "start this stage over".
 *
 * Carries the same five optional units as a delay, spelled `after…`, plus
 * `excludeDays`. Only what was filled in is sent.
 */
export function createStageDeadline({ toStageId, ...duration }) {
  return { ...writeDuration(readDuration(duration, 'after'), 'after'), toStageId };
}

/**
 * A stage. Steps do the work; transitions decide where the run goes next.
 * `deadline` is omitted rather than sent as null when unset.
 */
export function createStage({ id, title = '', steps = [], transitions = [], deadline = null }) {
  const stage = { id, title, steps, transitions };
  if (deadline) stage.deadline = deadline;
  return stage;
}

/** The graph itself. */
export function createGraph({ startStageId = null, stages = [] } = {}) {
  return { startStageId, stages };
}
