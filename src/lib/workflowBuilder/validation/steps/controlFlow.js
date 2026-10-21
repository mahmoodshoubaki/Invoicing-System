import { isEmptyGroup, validateFilterGroup } from '@/lib/filterDescription';
import { validateDuration } from '@/utils/workflowDuration';

/** The steps that shape a run rather than do work: delay, branch, forEach and repeat. */

// Five optional units plus excludeDays. The four ways it can be wrong are
// shared with a stage deadline, so the rules live in one place and both are
// refused in the same words.
export function checkDelay(step, { where, errors }) {
  errors.push(...validateDuration(step, 'delay', where));
}

export function checkBranch(step, { where, fields, allowUnknownFields, errors, warnings }) {
  if ((step.whenTrue?.length ?? 0) === 0 && (step.whenFalse?.length ?? 0) === 0) {
    warnings.push(`${where} has no steps on either arm, so it decides nothing.`);
  }
  if (fields.length > 0) {
    for (const problem of validateFilterGroup(step.condition, fields, { allowUnknownFields })) {
      errors.push(`${where}: ${problem}`);
    }
  }
}

export function checkForEach(step, { where, errors, warnings }) {
  if (!step.source?.trim()) errors.push(`${where} has no list to loop over.`);
  if (!step.itemName?.trim()) errors.push(`${where} has no name for each item.`);
  if ((step.body?.length ?? 0) === 0) warnings.push(`${where} has an empty body, so it does nothing.`);
}

export function checkRepeat(step, { where, fields, allowUnknownFields, errors, warnings }) {
  const counted = step.times != null;
  if (counted) {
    if (step.times <= 0) errors.push(`${where} repeats zero times.`);
  } else {
    if (step.maxIterations != null && step.maxIterations <= 0) {
      errors.push(`${where} has a maximum of zero iterations.`);
    }
    if (isEmptyGroup(step.until)) {
      // An empty group matches everything, so an empty `until` is satisfied
      // on the first check and the body never runs — the opposite of intent.
      warnings.push(`${where} has no stop condition, so it would finish immediately.`);
    } else if (fields.length > 0) {
      for (const problem of validateFilterGroup(step.until, fields, { allowUnknownFields })) {
        errors.push(`${where}: ${problem}`);
      }
    }
  }
  if ((step.body?.length ?? 0) === 0) warnings.push(`${where} has an empty body, so it does nothing.`);
}
