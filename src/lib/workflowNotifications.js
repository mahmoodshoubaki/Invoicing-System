import { STANDARD_TYPE } from '@/constants/notifications';

export const TASK_VALUE_NAMES = [
  'TaskTitle', 'TaskId', 'DueOn', 'AssigneeNames', 'TaskStatus', 'Outcome', 'CompletedByName', 'CompletedOn', 'Comment',
  'OutcomeReason',
];

export const TASK_NOTIFICATION_ENTRIES = [
  {
    key: 'assigned',
    label: 'When it is assigned',
    who: 'the people it is given to',
    standardType: STANDARD_TYPE.TASK_ASSIGNED,
    extraValues: [],
  },
  {
    key: 'reassignedTo',
    label: 'When it is handed to someone',
    who: 'the person it is handed to',
    standardType: STANDARD_TYPE.TASK_REASSIGNED_TO_YOU,
    extraValues: ['ReassignedByName'],
  },
  {
    key: 'reassignedFrom',
    label: 'When it is taken from someone',
    who: 'the people it was taken from',
    standardType: STANDARD_TYPE.TASK_REASSIGNED_FROM_YOU,
    extraValues: ['ReassignedByName', 'NewAssigneeNames'],
  },
  {
    key: 'cancelled',
    label: 'When it is no longer needed',
    who: 'the people who had it',
    standardType: STANDARD_TYPE.TASK_CANCELLED,
    extraValues: ['Reason', 'ArabicReason'],
  },
];

export const REMINDER_ENTRY = {
  key: 'reminder',
  label: 'Remind them before it is due',
  who: 'the people who have it',
  standardType: STANDARD_TYPE.TASK_REMINDER,
  extraValues: [],
};

export const DEFAULT_REMINDER = {
  typeKey: STANDARD_TYPE.TASK_REMINDER,
  beforeDueDays: 1,
  beforeDueHours: 0,
  repeat: false,
  repeatEveryDays: 1,
  repeatEveryHours: 0,
};

export function defaultTaskNotifications() {
  return {
    assigned: { typeKey: STANDARD_TYPE.TASK_ASSIGNED },
    reassignedTo: { typeKey: STANDARD_TYPE.TASK_REASSIGNED_TO_YOU },
    reassignedFrom: { typeKey: STANDARD_TYPE.TASK_REASSIGNED_FROM_YOU },
    cancelled: { typeKey: STANDARD_TYPE.TASK_CANCELLED },
    reminder: null,
  };
}

export const RUN_VALUE_NAMES = ['RunId', 'StageTitle'];

export const RUN_NOTIFICATION_ENTRIES = [
  {
    key: 'failed',
    label: 'A run stops with an error',
    standardType: STANDARD_TYPE.RUN_FAILED,
    extraValues: ['FailureReason'],
  },
  {
    key: 'paused',
    label: 'A run is paused',
    standardType: STANDARD_TYPE.RUN_PAUSED,
    extraValues: ['PausedByName', 'PauseReason'],
  },
  {
    key: 'resumed',
    label: 'A run is resumed',
    standardType: STANDARD_TYPE.RUN_RESUMED,
    extraValues: ['ResumedByName', 'ResumeNotes'],
  },
];

export function defaultRunNotifications() {
  return {
    failed: { typeKey: STANDARD_TYPE.RUN_FAILED },
    paused: { typeKey: STANDARD_TYPE.RUN_PAUSED },
    resumed: { typeKey: STANDARD_TYPE.RUN_RESUMED },
  };
}

export function effectiveTaskNotifications(step) {
  return step?.notifications ?? defaultTaskNotifications();
}

export function effectiveRunNotifications(graph) {
  return graph?.notifications ?? defaultRunNotifications();
}

export function selectedTypeKeysOfStep(step) {
  if (step?.type === 'sendNotification') {
    return step.notificationTypeKey != null ? [step.notificationTypeKey] : [];
  }
  if (step?.type === 'humanTask' && step.notifications) {
    return [...TASK_NOTIFICATION_ENTRIES.map((e) => e.key), 'reminder']
      .map((k) => step.notifications[k]?.typeKey)
      .filter((k) => k != null);
  }
  return [];
}

export function isEmailOrPlaceholder(value) {
  const text = String(value ?? '').trim();
  if (/^\{\{[^{}]+\}\}$/.test(text)) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}
