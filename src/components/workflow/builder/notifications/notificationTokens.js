/**
 * What a typed placeholder value may use, per kind of notification — the
 * `{{…}}` menu beside each box, and the "filled from the run" hint under an
 * empty one. Read from the engine (PendingNotificationSender), not guessed:
 *
 *   Send notification step  everything a condition there reads (variables, the
 *                           record, the loop item, answers), WorkflowName, and
 *                           the task's details when it points at a task
 *   a task's notifications  the run's VARIABLES only — not the record's fields —
 *                           WorkflowName, the task's details, and the event's own
 *   a run's notifications   the run's variables, WorkflowName, RunId, StageTitle,
 *                           and the event's own
 */

import { RUN_VALUE_NAMES, TASK_VALUE_NAMES } from '@/lib/workflowNotifications';

const LABELS = {
  WorkflowName: 'Workflow name',
  TaskTitle: 'Task title',
  TaskId: 'Task id',
  DueOn: 'Due date',
  AssigneeNames: 'Who has the task',
  TaskStatus: 'Task status',
  Outcome: 'Answer given',
  CompletedByName: 'Answered by',
  CompletedOn: 'Answered on',
  Comment: 'Comment',
  ReassignedByName: 'Handed over by',
  NewAssigneeNames: 'Handed to',
  Reason: 'Why it was cancelled',
  ArabicReason: 'Why it was cancelled (Arabic)',
  RunId: 'Run id',
  StageTitle: 'Stage',
  FailureReason: 'What went wrong',
  PausedByName: 'Paused by',
  PauseReason: 'Why it was paused',
  ResumedByName: 'Resumed by',
  ResumeNotes: 'Resume notes',
};

const asTokens = (names) => names.map((name) => ({ name, label: LABELS[name] ?? name, source: 'notification' }));

const variablesOf = (fields) => (fields ?? []).filter((f) => f.source === 'variable');

/** @param {Array} fields  the catalog at the step @param {boolean} aboutTask  whether it points at a task */
export function sendStepTokens(fields, aboutTask) {
  return [...(fields ?? []), ...asTokens(['WorkflowName', ...(aboutTask ? TASK_VALUE_NAMES : [])])];
}

/** @param {Array} fields @param {{ extraValues?: string[] }} entry  one of TASK_NOTIFICATION_ENTRIES */
export function taskNotificationTokens(fields, entry) {
  return [...variablesOf(fields), ...asTokens(['WorkflowName', ...TASK_VALUE_NAMES, ...(entry?.extraValues ?? [])])];
}

/** @param {Array} fields @param {{ extraValues?: string[] }} entry  one of RUN_NOTIFICATION_ENTRIES */
export function runNotificationTokens(fields, entry) {
  return [...variablesOf(fields), ...asTokens(['WorkflowName', ...RUN_VALUE_NAMES, ...(entry?.extraValues ?? [])])];
}
