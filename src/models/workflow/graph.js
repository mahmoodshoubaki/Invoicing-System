import { TRIGGER_KIND } from '@/constants/workflow';
import { readDuration, writeDuration } from '@/utils/workflowDuration';

import { createFilterGroup, isEmptyFilterGroup } from './conditions';

export const createTrigger = {
  event({ eventName }) {
    return { kind: TRIGGER_KIND.EVENT, eventName };
  },

  schedule({ cron, scan = null }) {
    const trigger = { kind: TRIGGER_KIND.SCHEDULE, cron };
    if (scan && !isEmptyFilterGroup(scan)) trigger.scan = scan;
    return trigger;
  },

  manual({ inputs = [] } = {}) {
    return { kind: TRIGGER_KIND.MANUAL, inputs };
  },
};

export function createVariable({ name, type, label = '', defaultValue = null, required = false }) {
  return { name, type, label: label || name, defaultValue, required };
}

export function createTransition({ condition = createFilterGroup(), toStageId = null } = {}) {
  return { condition, toStageId };
}

export function createStageDeadline({ toStageId, ...duration }) {
  return { ...writeDuration(readDuration(duration, 'after'), 'after'), toStageId };
}

export function createStage({ id, title = '', steps = [], transitions = [], deadline = null }) {
  const stage = { id, title, steps, transitions };
  if (deadline) stage.deadline = deadline;
  return stage;
}

export function createGraph({ startStageId = null, stages = [] } = {}) {
  return { startStageId, stages };
}
