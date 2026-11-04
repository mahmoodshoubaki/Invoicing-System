import { DEFAULT_AUTOMATED_MODE, HTTP_CALL_ACTION, STEP_TYPE } from '@/constants/workflow';
import { readDuration, writeDuration } from '@/utils/workflowDuration';

import { createFilterGroup, isEmptyFilterGroup } from './conditions';

export const createStep = {
  humanTask({
    id,
    title = '',
    assignToUserIds = [],
    assignToRoleIds = [],
    assignToGroupIds = [],
    assignToExpressions = [],
    outcomes = [],
    overdue = null,
    notifications = undefined,
    fields = [],
    ...duration
  }) {
    const step = {
      type: STEP_TYPE.HUMAN_TASK,
      id,
      title,
      assignToUserIds,
      assignToRoleIds,
      assignToGroupIds,
      assignToExpressions,
      ...writeDuration(readDuration(duration, 'dueIn'), 'dueIn'),
    };

    if (overdue?.toStageId) {
      step.overdue = { toStageId: overdue.toStageId, comeBack: overdue.comeBack === true };
    }

    if (notifications !== undefined) step.notifications = notifications;

    step.fields = fields;

    step.outcomes = outcomes;
    return step;
  },

  sendNotification({
    id,
    title = '',
    notificationTypeKey = null,
    toUserIds = [],
    toRoleIds = [],
    toGroupIds = [],
    toExpressions = [],
    toEmails = [],
    ccUserIds = [],
    ccRoleIds = [],
    ccGroupIds = [],
    ccExpressions = [],
    ccEmails = [],
    ccGetsEmail = true,
    ccGetsInApp = false,
    taskStepId = null,
    placeholderValues = {},
  }) {
    const step = {
      type: STEP_TYPE.SEND_NOTIFICATION,
      id,
      title,
      notificationTypeKey,
      toUserIds,
      toRoleIds,
      toGroupIds,
      toExpressions,
      toEmails,
      ccUserIds,
      ccRoleIds,
      ccGroupIds,
      ccExpressions,
      ccEmails,
      ccGetsEmail,
      ccGetsInApp,
    };
    if (taskStepId) step.taskStepId = taskStepId;
    step.placeholderValues = placeholderValues;
    return step;
  },

  automated({
    id,
    title = '',
    action = '',
    inputs = {},
    mode = DEFAULT_AUTOMATED_MODE,
  }) {
    return {
      type: STEP_TYPE.AUTOMATED,
      id,
      title,
      action,
      inputs,
      mode,
    };
  },

  httpCall({
    id,
    title = '',
    url = '',
    method = 'GET',
    body = null,
    contentType = 'application/json',
    headers = {},
    mode = DEFAULT_AUTOMATED_MODE,
  }) {
    const inputs = { url, method, contentType };
    if (body != null && method !== 'GET') inputs.body = body;
    for (const [name, value] of Object.entries(headers)) {
      if (name) inputs[`header.${name}`] = value;
    }

    return {
      type: STEP_TYPE.AUTOMATED,
      id,
      title,
      action: HTTP_CALL_ACTION,
      inputs,
      mode,
    };
  },

  branch({ id, title = '', condition = createFilterGroup(), whenTrue = [], whenFalse = [] }) {
    return {
      type: STEP_TYPE.BRANCH,
      id,
      title,
      condition,
      whenTrue,
      whenFalse,
    };
  },

  forEach({ id, title = '', source = '', itemName = 'item', body = [] }) {
    return {
      type: STEP_TYPE.FOR_EACH,
      id,
      title,
      source,
      itemName,
      body,
    };
  },

  repeat({ id, title = '', times = null, until = null, maxIterations = null, body = [] }) {
    const step = {
      type: STEP_TYPE.REPEAT,
      id,
      title,
    };
    if (times != null) {
      step.times = times;
    } else {
      step.until = until ?? createFilterGroup();
      step.maxIterations = maxIterations;
    }
    step.body = body;
    return step;
  },

  delay({ id, title = '', ...duration }) {
    return {
      type: STEP_TYPE.DELAY,
      id,
      title,
      ...writeDuration(readDuration(duration, 'delay'), 'delay'),
    };
  },

  parallel({ id, title = '', branches = [], joinWhen = null }) {
    const step = {
      type: STEP_TYPE.PARALLEL,
      id,
      title,
    };
    if (joinWhen && !isEmptyFilterGroup(joinWhen)) step.joinWhen = joinWhen;
    step.branches = branches;
    return step;
  },

  query({ id, title = '', targetTypeKey = null, filter = createFilterGroup(), into = '', max = null }) {
    const step = {
      type: STEP_TYPE.QUERY,
      id,
      title,
      targetTypeKey,
      filter,
      into,
    };
    if (max != null) step.max = max;
    return step;
  },

  setVariable({ id, title = '', name = '', value = '' }) {
    return {
      type: STEP_TYPE.SET_VARIABLE,
      id,
      title,
      name,
      value,
    };
  },
};

export function createParallelBranch({ id, title = '', steps = [] }) {
  return { id, title, steps };
}

export function createOutcome({ key, label = '', requiresComment = false, requiresFields = false, colorHex = null }) {
  return { key, label: label || key, requiresComment, requiresFields, colorHex };
}
