import { claimReferenceProblem, toClaimReference } from '@/lib/claimReference';

/** A saved date as date-input text (yyyy-mm-dd). */
export function toDateInput(iso) {
  return iso ? String(iso).split('T')[0] : '';
}

/**
 * The fields the form changed, ready for the update request. Unchanged fields are left out.
 * @param {object} invoice the saved invoice
 * @param {{ expectedCollectionDate: string, claimReference: string, reasonsForUpdate: string, attachmentIdsToDelete: string[], attachmentsToAdd: object[] }} form
 * @returns {object}
 */
export function invoiceChanges(invoice, form) {
  const changes = {};

  const date = form.expectedCollectionDate;
  if (date && date !== toDateInput(invoice.expectedCollectionDate)) changes.expectedCollectionDate = date;

  const reference = toClaimReference(form.claimReference);
  if (reference != null && reference !== invoice.financialClaimReference) changes.financialClaimReference = reference;

  const reasons = form.reasonsForUpdate.trim();
  if (reasons && reasons !== invoice.reasonsForUpdate) changes.reasonsForUpdate = reasons;

  if (form.attachmentIdsToDelete.length > 0) changes.attachmentIdsToDelete = form.attachmentIdsToDelete;

  const files = form.attachmentsToAdd.filter((a) => a.status === 'done');
  if (files.length > 0) changes.attachmentsToAdd = files;

  return changes;
}

/**
 * Validation messages by field. An empty value keeps the saved one, so emptying a saved value is refused.
 * @param {object} invoice the saved invoice
 * @param {{ expectedCollectionDate: string, claimReference: string }} form
 * @param {(key: string) => string} t the `invoices.form` translator
 * @returns {Record<string, string>}
 */
export function invoiceFormProblems(invoice, form, t) {
  const problems = {};

  if (!form.expectedCollectionDate && invoice.expectedCollectionDate) {
    problems.expectedCollectionDate = t('errors.dateRemoved');
  }

  if (!form.claimReference.trim() && invoice.financialClaimReference != null) {
    problems.financialClaimReference = t('errors.referenceRemoved');
  } else {
    const claimProblem = claimReferenceProblem(form.claimReference, t);
    if (claimProblem) problems.financialClaimReference = claimProblem;
  }

  return problems;
}
