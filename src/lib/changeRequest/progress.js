import { CR_STATUS } from '@/constants/changeRequests';
import { STEP, TONE, assembleSteps, workflowSteps } from '@/lib/workflowProgress';
import { formatDate } from '@/utils/formatters';

const DECISION = {
  [CR_STATUS.APPROVED]: { titleKey: 'steps.approved', tone: TONE.GOOD },
  [CR_STATUS.REJECTED]: { titleKey: 'steps.rejected', tone: TONE.BAD },
  [CR_STATUS.CANCELLED]: { titleKey: 'changeRequest.cancelled', tone: TONE.NEUTRAL },
};

function draftSteps(t) {
  return {
    steps: [
      { key: 'write', title: t('changeRequest.write'), state: STEP.CURRENT, note: t('changeRequest.writeNote') },
      { key: 'submit', title: t('steps.submitted'), state: STEP.NEXT, note: t('changeRequest.submitNote') },
      { key: 'approval', title: t('changeRequest.approval'), state: STEP.UPCOMING, note: t('changeRequest.approvalNote') },
      { key: 'decision', title: t('steps.decision'), state: STEP.UPCOMING, note: t('changeRequest.decisionNote') },
    ],
    next: t('changeRequest.submittedForApproval'),
  };
}

/**
 * @param {{ changeRequest: Object|null, run?: Object|null, history?: Array, graph?: Object|null, t: (key: string) => string, locale: string, formatDay?: (value) => string }} input changeRequest is null while it is being written; t is the `workflowProgress` translator
 * @returns {{ steps: Array, next: string|null }}
 */
export function changeRequestSteps({ changeRequest, run = null, history = [], graph = null, t, locale, formatDay = formatDate }) {
  if (!changeRequest) return draftSteps(t);

  const cr = changeRequest;
  const decided = DECISION[cr.statusId] ?? null;
  const returned = cr.statusId === CR_STATUS.RETURNED;
  const middle = workflowSteps({
    run,
    history,
    graph,
    settled: Boolean(decided),
    fallback: returned
      ? { title: t('changeRequest.returned'), note: t('changeRequest.returnedNote'), next: t('changeRequest.sentAgain') }
      : { title: t('changeRequest.approval'), note: null },
    endName: t('theDecision'),
    locale,
    notes: { faulted: t('faulted'), paused: t('paused') },
  });

  return assembleSteps(
    {
      key: 'raised',
      title: t('changeRequest.raised'),
      state: STEP.DONE,
      note: [cr.requestedByName, formatDay(cr.createdOn)].filter(Boolean).join(' · ') || null,
    },
    middle,
    decided
      ? { key: 'decision', title: t(decided.titleKey), tone: decided.tone, done: true }
      : { key: 'decision', title: t('steps.decision'), note: t('changeRequest.decisionNote'), done: false },
  );
}
