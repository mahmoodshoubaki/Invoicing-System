export const CR_DETAILS_MAX = 4000;
export const CR_OTHER_TYPE_MAX = 500;

export const CR_STATUS = {
  SUBMITTED: 1,
  RETURNED: 2,
  APPROVED: 3,
  REJECTED: 4,
  CANCELLED: 5,
};

export const isOpenChangeRequest = (statusId) => statusId === CR_STATUS.SUBMITTED || statusId === CR_STATUS.RETURNED;

export const CR_TARGET = {
  BOQ_ITEM: 3,
  PROJECT: 4,
};

export const CR_PERMISSIONS = {
  VIEW: { module: 'ChangeRequests', action: 'View', code: 'ChangeRequests.View' },
  VIEW_ALL: { module: 'ChangeRequests', action: 'ViewAll', code: 'ChangeRequests.ViewAll' },
  CREATE: { module: 'ChangeRequests', action: 'Create', code: 'ChangeRequests.Create' },
  UPDATE: { module: 'ChangeRequests', action: 'Update', code: 'ChangeRequests.Update' },
};

export const CR_RULES = [
  'A change request can only change approved items that have no invoices.',
  'Only one change request can be open on a BOQ at a time.',
  'While it is open, its items can’t be invoiced, edited, deleted or changed by a workflow task.',
];
