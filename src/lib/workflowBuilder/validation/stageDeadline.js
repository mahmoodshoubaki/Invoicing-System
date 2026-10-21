import { validateDuration } from '@/utils/workflowDuration';

/** A stage deadline's rules. */

/**
 * A stage's optional deadline.
 *
 * Unlike a transition's target, `toStageId` is required — a stage nobody
 * answered in time must not finish quietly. Pointing it back at its own stage IS
 * allowed, and means "start this stage over"; that is the one place
 * a self-reference is legal, which is why the transition rule does not apply.
 */
export function validateStageDeadline(stage, stageIds) {
  const errors = [];
  const deadline = stage.deadline;
  if (!deadline) return errors;

  // Same five units and the same four failures as a `delay` step.
  errors.push(...validateDuration(deadline, 'after', `The deadline on "${stage.title || stage.id}"`));

  if (!deadline.toStageId) {
    errors.push(`The deadline on "${stage.title || stage.id}" has nowhere to go. A stage nobody answered in time must not finish quietly.`);
  } else if (!stageIds.has(deadline.toStageId)) {
    errors.push(`The deadline on "${stage.title || stage.id}" points at a stage that no longer exists.`);
  }

  return errors;
}
