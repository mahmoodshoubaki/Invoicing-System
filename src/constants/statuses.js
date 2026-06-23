// BOQ Statuses
export const BOQ_STATUS = {
  DRAFT: 'Draft',
  PENDING_VERIFICATION: 'Pending Verification',
  APPROVED: 'Approved',
  PENDING_REQUEST: 'Pending Request',
  INVOICED: 'Invoiced',
  DELAYED: 'Delayed',
};

export const BOQ_STATUS_LIST = Object.values(BOQ_STATUS);

// Invoice Statuses
export const INVOICE_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DELAYED: 'Delayed',
};

export const INVOICE_STATUS_LIST = Object.values(INVOICE_STATUS);

// Project Statuses
export const PROJECT_STATUS = {
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export const PROJECT_STATUS_LIST = Object.values(PROJECT_STATUS);

// Workflow Statuses
export const WORKFLOW_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  DRAFT: 'Draft',
};

export const WORKFLOW_STATUS_LIST = Object.values(WORKFLOW_STATUS);

/**
 * Tailwind CSS color classes for BOQ status badges.
 * Returns { bg, text, border } class strings.
 */
export const BOQ_STATUS_COLORS = {
  [BOQ_STATUS.DRAFT]: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    dot: 'bg-gray-400',
  },
  [BOQ_STATUS.PENDING_VERIFICATION]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    dot: 'bg-yellow-500',
  },
  [BOQ_STATUS.APPROVED]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    dot: 'bg-green-500',
  },
  [BOQ_STATUS.PENDING_REQUEST]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    dot: 'bg-blue-500',
  },
  [BOQ_STATUS.INVOICED]: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
    dot: 'bg-purple-500',
  },
  [BOQ_STATUS.DELAYED]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    dot: 'bg-red-500',
  },
};

/**
 * Tailwind CSS color classes for Invoice status badges.
 */
export const INVOICE_STATUS_COLORS = {
  [INVOICE_STATUS.DRAFT]: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    dot: 'bg-gray-400',
  },
  [INVOICE_STATUS.SUBMITTED]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    dot: 'bg-blue-500',
  },
  [INVOICE_STATUS.UNDER_REVIEW]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    dot: 'bg-yellow-500',
  },
  [INVOICE_STATUS.APPROVED]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    dot: 'bg-green-500',
  },
  [INVOICE_STATUS.REJECTED]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    dot: 'bg-red-500',
  },
  [INVOICE_STATUS.DELAYED]: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
    dot: 'bg-orange-500',
  },
};

/**
 * Tailwind CSS color classes for Project status badges.
 */
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

/**
 * Tailwind CSS color classes for Workflow status badges.
 */
export const WORKFLOW_STATUS_COLORS = {
  [WORKFLOW_STATUS.ACTIVE]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    dot: 'bg-green-500',
  },
  [WORKFLOW_STATUS.INACTIVE]: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-300',
    dot: 'bg-gray-400',
  },
  [WORKFLOW_STATUS.DRAFT]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    dot: 'bg-yellow-500',
  },
};
