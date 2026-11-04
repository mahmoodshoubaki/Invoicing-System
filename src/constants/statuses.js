export const BOQ_STATUS = {
  DRAFT: 'Draft',
  PENDING_VERIFICATION: 'Pending Verification',
  APPROVED: 'Approved',
  PENDING_REQUEST: 'Pending Request',
  INVOICED: 'Invoiced',
  DELAYED: 'Delayed',
};

export const INVOICE_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DELAYED: 'Delayed',
};

export const INVOICE_STATUS_ID = {
  INVOICED: 1,
  IN_PROGRESS: 2,
  REJECTED: 3,
  COLLECTED: 4,
  CANCELLED: 5,
};

export const BOQ_ITEM_STATUS_ID = {
  DRAFT: 1,
  APPROVED: 2,
  SUBMITTED: 3,
  REJECTED: 4,
};

export const DELETABLE_INVOICE_STATUS_IDS = [
  INVOICE_STATUS_ID.REJECTED,
  INVOICE_STATUS_ID.CANCELLED,
];

export const TRACKER_CYCLE_STATUS = {
  SCHEDULED: 'Scheduled',
};

export const PROJECT_STATUS = {
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export const PROJECT_STATUS_LIST = Object.values(PROJECT_STATUS);

export const PROJECT_STATUS_COLORS = {
  [PROJECT_STATUS.ACTIVE]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    dot: 'bg-green-500',
  },
  [PROJECT_STATUS.ON_HOLD]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    dot: 'bg-yellow-500',
  },
  [PROJECT_STATUS.COMPLETED]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    dot: 'bg-blue-500',
  },
  [PROJECT_STATUS.ARCHIVED]: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-300',
    dot: 'bg-gray-400',
  },
};

