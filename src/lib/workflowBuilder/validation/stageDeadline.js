import { validateDuration } from '@/utils/workflowDuration';

export function validateStageDeadline(stage, stageIds) {
  const errors = [];
  const deadline = stage.deadline;
  if (!deadline) return errors;

  errors.push(...validateDuration(deadline, 'after', `The deadline on "${stage.title || stage.id}"`));

  if (!deadline.toStageId) {
    errors.push(`The deadline on "${stage.title || stage.id}" has nowhere to go. A stage nobody answered in time must not finish quietly.`);
  } else if (!stageIds.has(deadline.toStageId)) {
    errors.push(`The deadline on "${stage.title || stage.id}" points at a stage that no longer exists.`);
  }

  return errors;
}
