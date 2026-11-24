import { BOQ_ITEM_STATUS_ID } from '@/constants/statuses';
import { STEP, TONE, assembleSteps, workflowSteps } from '@/lib/workflowProgress';

const DECIDED = {
  [BOQ_ITEM_STATUS_ID.APPROVED]: { titleKey: 'steps.approved', tone: TONE.GOOD },
  [BOQ_ITEM_STATUS_ID.REJECTED]: { titleKey: 'steps.rejected', tone: TONE.BAD },
};

/**
 * @param {{ item: Object, run?: Object|null, history?: Array, graph?: Object|null, t: (key: string) => string, locale: string }} input t is the `workflowProgress` translator
 * @returns {{ steps: Array, next: string|null }}
 */
export function boqItemSteps({ item, run = null, history = [], graph = null, t, locale }) {
  if (item.statusId === BOQ_ITEM_STATUS_ID.DRAFT) {
    return {
      steps: [
        { key: 'draft', title: t('steps.draft'), state: STEP.CURRENT, note: t('steps.notSubmitted') },
        { key: 'submitted', title: t('steps.submitted'), state: STEP.NEXT },
        { key: 'workflow', title: t('steps.review'), state: STEP.UPCOMING },
        { key: 'decision', title: t('steps.decision'), state: STEP.UPCOMING, note: t('steps.approvedOrRejected') },
      ],
      next: t('steps.submittedForReview'),
    };
  }

  const decided = DECIDED[item.statusId] ?? null;
  const middle = workflowSteps({
    run,
    history,
    graph,
    settled: Boolean(decided),
    fallback: { title: t('steps.review'), note: null },
    endName: t('theDecision'),
    locale,
    notes: { faulted: t('faulted'), paused: t('paused') },
  });

  return assembleSteps(
    { key: 'submitted', title: t('steps.submitted'), state: STEP.DONE, note: item.submittedByName ?? null },
    middle,
    decided
      ? { key: 'decision', title: t(decided.titleKey), tone: decided.tone, done: true }
      : { key: 'decision', title: t('steps.decision'), note: t('steps.approvedOrRejected'), done: false },
  );
}
