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

/**
 * The invoice status ids the money totals depend on.
 *
 * Labels come from `GetInvoiceStatuses` and are what the screens display; these
 * three are here because a sum has to know which rows count, and "the one
 * called Collected" would change meaning the day somebody renames it.
 *
 * Only the three that decide a total are listed. Every other status is
 * "raised and not collected yet", whatever it is called.
 */
export const INVOICE_STATUS_ID = {
  INVOICED: 1,
  IN_PROGRESS: 2,
  REJECTED: 3,
  COLLECTED: 4,
  CANCELLED: 5,
};

/**
 * The BOQ item status ids (2026-10-21), as the backend seeds them — for the
 * item's stepper, which has to know which ones end its review. Labels and
 * colours still come from GetBoqItemStatuses.
 */
export const BOQ_ITEM_STATUS_ID = {
  DRAFT: 1,
  APPROVED: 2,
  SUBMITTED: 3,
  REJECTED: 4,
};

/**
 * The only statuses an invoice can be deleted in. Invoiced and Collected mean
 * money billed or received; since 2026-10-11 In Progress is refused too — its
 * workflow is still running, so a mistake is cancelled first and then deleted.
 * The backend refuses the rest with INV-010, so the control is not offered.
 */
export const DELETABLE_INVOICE_STATUS_IDS = [
  INVOICE_STATUS_ID.REJECTED,
  INVOICE_STATUS_ID.CANCELLED,
];

// Tracker Cycle Statuses
// NOTE: label string only — names the single "still editable" cycle status.
// Every other status (Completed, Delayed, or anything added later) is
// treated as locked without needing to be enumerated here. IDs/colors come
// from GetTrackerCycleStatuses via lookupsSlice
// (selectTrackerCycleStatusesMap / selectTrackerCycleStatusColorsMap).
export const TRACKER_CYCLE_STATUS = {
  SCHEDULED: 'Scheduled',
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

