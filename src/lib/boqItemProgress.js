/**
 * Where a BOQ item is, as steps (2026-10-21): submitted, the workflow
 * reviewing it (see lib/workflowProgress), and the decision. A draft has not
 * been submitted, so that is the step it is on.
 */

import { BOQ_ITEM_STATUS_ID } from '@/constants/statuses';
import { STEP, TONE, assembleSteps, workflowSteps } from '@/lib/workflowProgress';

const DECIDED = {
  [BOQ_ITEM_STATUS_ID.APPROVED]: { title: 'Approved', tone: TONE.GOOD },
  [BOQ_ITEM_STATUS_ID.REJECTED]: { title: 'Rejected', tone: TONE.BAD },
};

/**
 * @param {{ item: Object, run?: Object|null, history?: Array, graph?: Object|null }} input
 * @returns {{ steps: Array, next: string|null }}
 */
export function boqItemSteps({ item, run = null, history = [], graph = null }) {
  if (item.statusId === BOQ_ITEM_STATUS_ID.DRAFT) {
    return {
      steps: [
        { key: 'draft', title: 'Draft', state: STEP.CURRENT, note: 'Not submitted yet' },
        { key: 'submitted', title: 'Submitted', state: STEP.NEXT },
        { key: 'workflow', title: 'Review', state: STEP.UPCOMING },
        { key: 'decision', title: 'Decision', state: STEP.UPCOMING, note: 'Approved or rejected' },
      ],
      next: 'Submitted for review',
    };
  }

  const decided = DECIDED[item.statusId] ?? null;
  const middle = workflowSteps({
    run,
    history,
    graph,
    settled: Boolean(decided),
    fallback: { title: 'Review', note: null },
  });

  return assembleSteps(
    { key: 'submitted', title: 'Submitted', state: STEP.DONE, note: item.submittedByName ?? null },
    middle,
    decided
      ? { key: 'decision', title: decided.title, tone: decided.tone, done: true }
      : { key: 'decision', title: 'Decision', note: 'Approved or rejected', done: false },
  );
}
