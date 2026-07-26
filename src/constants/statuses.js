// BOQ Statuses
// NOTE: string labels only — used by the mock BOQ data/services that aren't
// wired to the real API yet. Colors are NOT defined here anymore: real BOQ
// item statuses (id + label + color) come from GetBoqItemStatuses via
// lookupsSlice (selectBoqItemStatusesMap / selectBoqItemStatusColorsMap).
export const BOQ_STATUS = {
  DRAFT: 'Draft',
  PENDING_VERIFICATION: 'Pending Verification',
  APPROVED: 'Approved',
  PENDING_REQUEST: 'Pending Request',
  INVOICED: 'Invoiced',
  DELAYED: 'Delayed',
};

// Invoice Statuses
// NOTE: string labels only — used by the mock invoice data/services that
// aren't wired to the real API yet. Colors are NOT defined here anymore: real
// invoice statuses (id + label + color) come from GetInvoiceStatuses via
// lookupsSlice (selectInvoiceStatusesMap / selectInvoiceStatusColorsMap).
export const INVOICE_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DELAYED: 'Delayed',
};

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
