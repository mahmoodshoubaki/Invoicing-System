/**
 * Change requests (2026-10-18; wired to api/BoqChangeRequests 2026-10-19): a
 * formal request to change a BOQ that is already approved, with the reasons
 * for it. Nothing changes until an approver accepts it — like an amendment to a
 * signed contract.
 *
 * The reasons (with their fixed justifications, English and Arabic) and the
 * statuses come from the server — see lookupsSlice.
 */

/** The most the additional details may hold. */
export const CR_DETAILS_MAX = 4000;

export const CR_STATUS = {
  SUBMITTED: 1,
  RETURNED: 2,
  APPROVED: 3,
  REJECTED: 4,
  CANCELLED: 5,
};

/** Still open: waiting on the approver, or sent back to the requester. Only one may be open per BOQ. */
export const isOpenChangeRequest = (statusId) => statusId === CR_STATUS.SUBMITTED || statusId === CR_STATUS.RETURNED;

/** What a field change is about: a BOQ item (its id), or an EPM sub-project (its projectUID). */
export const CR_TARGET = {
  BOQ_ITEM: 3,
  PROJECT: 4,
};

export const CR_PERMISSIONS = {
  VIEW: { module: 'ChangeRequests', action: 'View', code: 'ChangeRequests.View' },
  VIEW_ALL: { module: 'ChangeRequests', action: 'ViewAll', code: 'ChangeRequests.ViewAll' },
  CREATE: { module: 'ChangeRequests', action: 'Create', code: 'ChangeRequests.Create' },
  // Editing a request that was sent back — and only by whoever raised it.
  UPDATE: { module: 'ChangeRequests', action: 'Update', code: 'ChangeRequests.Update' },
};

/** The rules, in the words the screens show them. */
export const CR_RULES = [
  'A change request can only change approved items that have no invoices.',
  'Only one change request can be open on a BOQ at a time.',
  'While it is open, its items can’t be invoiced, edited, deleted or changed by a workflow task.',
];
