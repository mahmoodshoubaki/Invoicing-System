/**
 * The Notifications module's keys and capabilities.
 *
 * Every key below is documented as stable in the backend handoff
 * (`notifications-frontend-handoff.md`, §1). Their LABELS and colours still come
 * from the lookup endpoints — these exist only for the places that have to name
 * a specific one ("only email shows open/click tracking").
 */

/**
 * `can(module, action)` reads a permission's `module` + display `name`, not its
 * code — the names below are copied from the backend's permission seed, spaces
 * included ("Manage Settings", "Manage Jobs").
 */
export const NOTIFICATION_PERMISSIONS = {
  VIEW: { module: 'Notifications', action: 'View', code: 'Notifications.View' },
  MANAGE: { module: 'Notifications', action: 'Manage', code: 'Notifications.Manage' },
  PUBLISH: { module: 'Notifications', action: 'Publish', code: 'Notifications.Publish' },
  DELETE: { module: 'Notifications', action: 'Delete', code: 'Notifications.Delete' },
  MANAGE_SETTINGS: { module: 'Notifications', action: 'Manage Settings', code: 'Notifications.ManageSettings' },
};

export const SYSTEM_PERMISSIONS = {
  MANAGE_JOBS: { module: 'System', action: 'Manage Jobs', code: 'System.ManageJobs' },
};

export const CHANNEL = {
  EMAIL: 1,
  IN_APP: 2,
};

export const PRIORITY = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  URGENT: 4,
  CRITICAL: 5,
};

export const TEMPLATE_LANGUAGE = {
  ENGLISH: 1,
  ARABIC: 2,
  ENGLISH_THEN_ARABIC: 3,
  ARABIC_THEN_ENGLISH: 4,
};

export const DELIVERY_STATUS = {
  PENDING: 1,
  SENT: 2,
  DELIVERED: 3,
  FAILED: 4,
  DEAD_LETTERED: 5,
  PROCESSING: 6,
  FAULTED: 7,
  INVALID: 8,
  REFUSED: 9,
};

export const EMAIL_PROVIDER = {
  SMTP: 1,
  SES: 2,
};

/** What happened to one person a send request named — request log, §7.2. */
export const REQUEST_OUTCOME = {
  CREATED: 1,
  ALREADY_SENT: 2,
  SKIPPED: 3,
};

/**
 * The standard types' keys. Seeded below 1000 and never deletable; types
 * admins add start at 1000. Workflows refer to a type by this key.
 */
export const STANDARD_TYPE = {
  TASK_ASSIGNED: 1,
  TASK_REASSIGNED_TO_YOU: 2,
  TASK_REASSIGNED_FROM_YOU: 3,
  TASK_CANCELLED: 4,
  TASK_REMINDER: 5,
  RUN_FAILED: 6,
  RUN_PAUSED: 7,
  RUN_RESUMED: 8,
};

/** Admin-made types start here. */
export const FIRST_CUSTOM_TYPE_KEY = 1000;

/** The bell asks for its badge this often (there is no push). */
export const BELL_POLL_MS = 60_000;

/** `take` is clamped to 1–200 by every paged endpoint. */
export const MAX_PAGE_SIZE = 200;

/** The audit pages, both modules, share these areas. */
export const NOTIFICATION_CONFIG_AREAS = [
  'Notification setting',
  'Email sender',
  'Notification type',
  'Template',
  'Background job',
];

export const WORKFLOW_CONFIG_AREAS = [
  'Workflow',
  'Workflow setting',
  'Approved API domain',
  'Background job',
];
