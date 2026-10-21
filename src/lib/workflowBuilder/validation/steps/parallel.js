import {
  AUTOMATED_MODE,
  BUILDER_LIMITS,
  DEFAULT_AUTOMATED_MODE,
  STEP_TYPE,
  STEP_TYPE_INFO,
  TYPES_FORBIDDEN_IN_BRANCH,
} from '@/constants/workflow';
import { isEmptyGroup, validateFilterGroup } from '@/lib/filterDescription';

/** A parallel step's rules — and what may not run inside one of its branches. */

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
    // `stepId.outcome` is readable here and is not in GetFields, so unknown
    // names are expected rather than wrong.
    for (const problem of validateFilterGroup(step.joinWhen, fields, { allowUnknownFields: true })) {
      errors.push(`${where}: ${problem}`);
    }
  }
}

/**
 * Step types that cannot appear anywhere inside a parallel branch.
 *
 * Each parks the run using something the run keeps exactly one of — one wake-up
 * time, one set of branch cursors, one retry slot — so two branches doing it at
 * once would be sharing a single slot. The check recurses, because a `delay`
 * nested three levels down a branch is just as fatal as one at the top.
 *
 * @returns {string[]} human descriptions of what was found
 */
function findForbiddenInBranch(steps) {
  const found = [];

  const walk = (list) => {
    for (const step of list ?? []) {
      if (TYPES_FORBIDDEN_IN_BRANCH.includes(step.type)) {
        found.push(`a "${step.title || step.id}" ${STEP_TYPE_INFO[step.type]?.label.toLowerCase() ?? step.type} step`);
      }
      /*
       * `?? DEFAULT_AUTOMATED_MODE` is load-bearing, not defensive.
       *
       * Retrying is now what a step means when it says nothing, so an automated
       * step dropped into a branch with no mode chosen is refused at save with
       * WF-008 — even though nothing in it mentions retrying. Reading the
       * default here is what makes the builder catch that instead of the server.
       */
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
