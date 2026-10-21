/** What may not be pasted or moved into a parallel branch. */

import { STEP_TYPE_INFO, TYPES_FORBIDDEN_IN_BRANCH } from '@/constants/workflow';

import { childLists } from './tree';

/**
 * Steps in a paste that can never run inside a parallel branch — a `delay` or a
 * `parallel`, at any depth.
 *
 * These refuse the paste. No setting makes them valid there, so pasting them
 * would only leave something to delete.
 *
 * A Call API step set to retry on its own is deliberately NOT here. It is fixed
 * by choosing another mode, which is the author's decision, so it pastes as it
 * is and the builder's existing error names it. Switching the mode quietly
 * would change what the step does when a call fails.
 *
 * @returns {string[]} descriptions, e.g. `"Wait 2 days" (a delay)`
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
