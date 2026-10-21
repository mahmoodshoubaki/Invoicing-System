/**
 * The notification checkboxes a workflow carries (2026-10-07) — on each human
 * task step, and on the workflow as a whole — and what they mean when absent.
 *
 * The rule that shapes everything here: a MISSING block means "the engine's
 * defaults" (every workflow saved before this has none), while a block that is
 * present means exactly what it says — an entry left out or `null` sends
 * nothing. So the screens show the defaults for an absent block, and the first
 * change writes the whole block out, defaults included, before applying it.
 */

import { STANDARD_TYPE } from '@/constants/notifications';

/**
 * What every notification about a task carries, besides the run's variables
 * and `WorkflowName` — the same names a Send notification step gets when it
 * points at a task. The engine's GetTaskValues.
 */
export const TASK_VALUE_NAMES = [
  'TaskTitle', 'TaskId', 'DueOn', 'AssigneeNames', 'TaskStatus', 'Outcome', 'CompletedByName', 'CompletedOn', 'Comment',
];

/**
 * The five things a human task can tell people, in the order the form lists
 * them. `extraValues` are what that one event adds to the task's values.
 */
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

/** A reminder's starting values when it is first ticked: 1 day before, no repeat. */
export const DEFAULT_REMINDER = {
  typeKey: STANDARD_TYPE.TASK_REMINDER,
  beforeDueDays: 1,
  beforeDueHours: 0,
  repeat: false,
  repeatEveryDays: 1,
  repeatEveryHours: 0,
};

/** What a human task with no `notifications` block sends — the engine's Defaults. */
export function defaultTaskNotifications() {
  return {
    assigned: { typeKey: STANDARD_TYPE.TASK_ASSIGNED },
    reassignedTo: { typeKey: STANDARD_TYPE.TASK_REASSIGNED_TO_YOU },
    reassignedFrom: { typeKey: STANDARD_TYPE.TASK_REASSIGNED_FROM_YOU },
    cancelled: { typeKey: STANDARD_TYPE.TASK_CANCELLED },
    reminder: null,
  };
}

/** What every run notification carries, besides the run's variables and `WorkflowName`. */
export const RUN_VALUE_NAMES = ['RunId', 'StageTitle'];

/** The workflow-level three, all to the workflow admins (everyone with Workflows.Manage). */
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

/** The block as it behaves: the saved one, or the defaults when there is none. */
export function effectiveTaskNotifications(step) {
  return step?.notifications ?? defaultTaskNotifications();
}

export function effectiveRunNotifications(graph) {
  return graph?.notifications ?? defaultRunNotifications();
}

/**
 * Every notification type key a definition names — so a save can check them
 * against the type list before the server refuses an unknown one (WF-050).
 */
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

/** A typed address must be a real address; a `{{field}}` is checked when the run gets there. */
export function isEmailOrPlaceholder(value) {
  const text = String(value ?? '').trim();
  if (/^\{\{[^{}]+\}\}$/.test(text)) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}
