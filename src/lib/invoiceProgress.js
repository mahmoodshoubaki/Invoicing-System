/**
 * Where an invoice is, as steps (2026-10-21): submitted, the workflow taking
 * it through (see lib/workflowProgress), and where it ends — collected, or
 * rejected or cancelled on the way. Invoiced is a status on the way, not an
 * end: the money is still to come in.
 */

import { INVOICE_STATUS_ID } from '@/constants/statuses';
import { STEP, TONE, assembleSteps, workflowSteps } from '@/lib/workflowProgress';
import { formatDate } from '@/utils/formatters';

const ENDED = {
  [INVOICE_STATUS_ID.COLLECTED]: { title: 'Collected', tone: TONE.GOOD },
  [INVOICE_STATUS_ID.REJECTED]: { title: 'Rejected', tone: TONE.BAD },
  [INVOICE_STATUS_ID.CANCELLED]: { title: 'Cancelled', tone: TONE.NEUTRAL },
};

/**
 * @param {{ invoice: Object, run?: Object|null, history?: Array, graph?: Object|null }} input
 * @returns {{ steps: Array, next: string|null }}
 */
export function invoiceSteps({ invoice, run = null, history = [], graph = null }) {
  const ended = ENDED[invoice.statusId] ?? null;
  const invoiced = invoice.statusId === INVOICE_STATUS_ID.INVOICED;
  const middle = workflowSteps({
    run,
    history,
    graph,
    settled: Boolean(ended),
    fallback: invoiced
      ? { title: 'Invoiced', note: 'Waiting for the payment' }
      : { title: 'Processing', note: null },
    endName: 'the end of its workflow',
  });

  return assembleSteps(
    {
      key: 'submitted',
      title: 'Submitted',
      state: STEP.DONE,
      note: [invoice.submittedByName, formatDate(invoice.submissionDate ?? invoice.creationDate)].filter(Boolean).join(' · ') || null,
    },
    middle,
    ended
      ? { key: 'end', title: ended.title, tone: ended.tone, done: true }
      : { key: 'end', title: 'Collected', note: invoiced ? 'Invoiced — waiting for the payment' : 'Once it is invoiced and paid', done: false },
  );
}
