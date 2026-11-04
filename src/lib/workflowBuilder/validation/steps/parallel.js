import {
  AUTOMATED_MODE,
  BUILDER_LIMITS,
  DEFAULT_AUTOMATED_MODE,
  STEP_TYPE,
  STEP_TYPE_INFO,
  TYPES_FORBIDDEN_IN_BRANCH,
} from '@/constants/workflow';
import { isEmptyGroup, validateFilterGroup } from '@/lib/filterDescription';

export function checkParallel(step, { where, fields, errors }) {
  const branches = step.branches ?? [];

  if (branches.length < BUILDER_LIMITS.MIN_PARALLEL_BRANCHES) {
    errors.push(
      `${where} needs at least ${BUILDER_LIMITS.MIN_PARALLEL_BRANCHES} branches. One branch is not parallel work, it is the steps written out.`
    );
  }

  const branchIds = branches.map((b) => b.id);
  if (branchIds.some((id) => !id?.trim())) errors.push(`${where} has a branch with no id.`);
  if (new Set(branchIds).size !== branchIds.length) errors.push(`${where} has two branches sharing an id.`);

  for (const branch of branches) {
    if ((branch.steps?.length ?? 0) === 0) {
      errors.push(`${where}: branch "${branch.title || branch.id}" has no steps.`);
    }
    for (const forbidden of findForbiddenInBranch(branch.steps)) {
      errors.push(`${where}: branch "${branch.title || branch.id}" contains ${forbidden}, which cannot run inside a parallel branch.`);
    }
  }

  if (step.joinWhen && !isEmptyGroup(step.joinWhen) && fields.length > 0) {
    for (const problem of validateFilterGroup(step.joinWhen, fields, { allowUnknownFields: true })) {
      errors.push(`${where}: ${problem}`);
    }
  }
}

/**
 * @returns {string[]}
 */
function findForbiddenInBranch(steps) {
  const found = [];

  const walk = (list) => {
    for (const step of list ?? []) {
      if (TYPES_FORBIDDEN_IN_BRANCH.includes(step.type)) {
        found.push(`a "${step.title || step.id}" ${STEP_TYPE_INFO[step.type]?.label.toLowerCase() ?? step.type} step`);
      }
      if (step.type === STEP_TYPE.AUTOMATED
        && (step.mode ?? DEFAULT_AUTOMATED_MODE) === AUTOMATED_MODE.QUEUE_AND_RETRY) {
        found.push(
          step.mode
            ? `"${step.title || step.id}" set to retry on its own`
            : `"${step.title || step.id}", which retries on its own unless told otherwise`
        );
      }
      walk(step.whenTrue);
      walk(step.whenFalse);
      walk(step.body);
      for (const branch of step.branches ?? []) walk(branch.steps);
    }
  };

  walk(steps);
  return found;
}
