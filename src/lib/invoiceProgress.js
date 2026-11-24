import { INVOICE_STATUS_ID } from '@/constants/statuses';
import { STEP, TONE, assembleSteps, workflowSteps } from '@/lib/workflowProgress';
import { formatDate } from '@/utils/formatters';

const ENDED = {
  [INVOICE_STATUS_ID.COLLECTED]: { titleKey: 'invoice.collected', tone: TONE.GOOD },
  [INVOICE_STATUS_ID.REJECTED]: { titleKey: 'steps.rejected', tone: TONE.BAD },
  [INVOICE_STATUS_ID.CANCELLED]: { titleKey: 'invoice.cancelled', tone: TONE.NEUTRAL },
};

const AWAITING_PAYMENT = {
  [INVOICE_STATUS_ID.INVOICED]: {
    titleKey: 'invoice.invoiced',
    noteKey: 'invoice.waitingPayment',
    endNoteKey: 'invoice.invoicedWaiting',
  },
  [INVOICE_STATUS_ID.PARTIALLY_COLLECTED]: {
    titleKey: 'invoice.partiallyCollected',
    noteKey: 'invoice.waitingRest',
    endNoteKey: 'invoice.partPaid',
  },
};

/**
 * @param {{ invoice: Object, run?: Object|null, history?: Array, graph?: Object|null, t: (key: string) => string, locale: string, formatDay?: (value) => string }} input t is the `workflowProgress` translator
 * @returns {{ steps: Array, next: string|null }}
 */
export function invoiceSteps({ invoice, run = null, history = [], graph = null, t, locale, formatDay = formatDate }) {
  const ended = ENDED[invoice.statusId] ?? null;
  const awaiting = AWAITING_PAYMENT[invoice.statusId] ?? null;
  const middle = workflowSteps({
    run,
    history,
    graph,
    settled: Boolean(ended),
    fallback: awaiting
      ? { title: t(awaiting.titleKey), note: t(awaiting.noteKey) }
      : { title: t('invoice.processing'), note: null },
    endName: t('invoice.endOfWorkflow'),
    locale,
    notes: { faulted: t('faulted'), paused: t('paused') },
  });

  return assembleSteps(
    {
      key: 'submitted',
      title: t('steps.submitted'),
      state: STEP.DONE,
      note: [invoice.submittedByName, formatDay(invoice.submissionDate ?? invoice.creationDate)].filter(Boolean).join(' · ') || null,
    },
    middle,
    ended
      ? { key: 'end', title: t(ended.titleKey), tone: ended.tone, done: true }
      : { key: 'end', title: t('invoice.collected'), note: t(awaiting?.endNoteKey ?? 'invoice.oncePaid'), done: false },
  );
}
