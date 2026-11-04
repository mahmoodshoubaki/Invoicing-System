import { STEP_TYPE_INFO, TYPES_FORBIDDEN_IN_BRANCH } from '@/constants/workflow';

import { childLists } from './tree';

/**
 * @returns {string[]}
 */
export function refusedInBranch(steps) {
  const found = [];
  const walk = (list) => {
    for (const step of list ?? []) {
      if (TYPES_FORBIDDEN_IN_BRANCH.includes(step.type)) {
        const kind = STEP_TYPE_INFO[step.type]?.label.toLowerCase() ?? step.type;
        found.push(`"${step.title || step.id}" (a ${kind})`);
        // Whatever it holds goes with it; naming its insides too says nothing more.
        continue;
      }
      for (const inner of childLists(step)) walk(inner);
    }
  };
  walk(steps);
  return found;
}
