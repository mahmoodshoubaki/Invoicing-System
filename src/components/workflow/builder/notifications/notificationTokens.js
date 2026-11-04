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
  OutcomeReason: 'Reason given with the answer',
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

/** @param {Array} fields */
export function sendStepTokens(fields, aboutTask) {
  return [...(fields ?? []), ...asTokens(['WorkflowName', ...(aboutTask ? TASK_VALUE_NAMES : [])])];
}

/** @param {Array} fields */
export function taskNotificationTokens(fields, entry) {
  return [...variablesOf(fields), ...asTokens(['WorkflowName', ...TASK_VALUE_NAMES, ...(entry?.extraValues ?? [])])];
}

/** @param {Array} fields */
export function runNotificationTokens(fields, entry) {
  return [...variablesOf(fields), ...asTokens(['WorkflowName', ...RUN_VALUE_NAMES, ...(entry?.extraValues ?? [])])];
}
