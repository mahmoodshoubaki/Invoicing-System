/**
 * Where a change request is, as steps (2026-10-21): raised, the workflow
 * deciding it (see lib/workflowProgress), and the decision. A request still
 * being written is the first step of its own.
 */

import { CR_STATUS } from '@/constants/changeRequests';
import { STEP, TONE, assembleSteps, workflowSteps } from '@/lib/workflowProgress';
import { formatDate } from '@/utils/formatters';

const DECISION = {
  [CR_STATUS.APPROVED]: { title: 'Approved', tone: TONE.GOOD },
  [CR_STATUS.REJECTED]: { title: 'Rejected', tone: TONE.BAD },
  [CR_STATUS.CANCELLED]: { title: 'Cancelled', tone: TONE.NEUTRAL },
};

/** The steps of a request still being written. */
function draftSteps() {
  return {
    steps: [
      { key: 'write', title: 'Write the request', state: STEP.CURRENT, note: 'Reasons, details and changes' },
      { key: 'submit', title: 'Submitted', state: STEP.NEXT, note: 'Its items are locked from then on' },
      { key: 'approval', title: 'Approval', state: STEP.UPCOMING, note: 'By the workflow’s approvers' },
      { key: 'decision', title: 'Decision', state: STEP.UPCOMING, note: 'Approved, rejected or cancelled' },
    ],
    next: 'Submitted for approval',
  };
}

/**
 * @param {{
 *   changeRequest: Object|null,  mapChangeRequest's; null while it is being written
 *   run?: Object|null, history?: Array, graph?: Object|null,  see useRecordProgress
 * }} input
 * @returns {{ steps: Array, next: string|null }}
 */
export function changeRequestSteps({ changeRequest, run = null, history = [], graph = null }) {
  if (!changeRequest) return draftSteps();

  const cr = changeRequest;
  const decided = DECISION[cr.statusId] ?? null;
  const returned = cr.statusId === CR_STATUS.RETURNED;
  const middle = workflowSteps({
    run,
    history,
    graph,
    settled: Boolean(decided),
    fallback: returned
      ? { title: 'Back with the requester', note: 'To change and send again', next: 'Sent again for approval' }
      : { title: 'Approval', note: null },
  });

  return assembleSteps(
    {
      key: 'raised',
      title: 'Raised',
      state: STEP.DONE,
      note: [cr.requestedByName, formatDate(cr.createdOn)].filter(Boolean).join(' · ') || null,
    },
    middle,
    decided
      ? { key: 'decision', title: decided.title, tone: decided.tone, done: true }
      : { key: 'decision', title: 'Decision', note: 'Approved, rejected or cancelled', done: false },
  );
}
