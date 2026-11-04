export const NOTIFICATION_PERMISSIONS = {
  VIEW: { module: 'Notifications', action: 'View', code: 'Notifications.View' },
  MANAGE: { module: 'Notifications', action: 'Manage', code: 'Notifications.Manage' },
  PUBLISH: { module: 'Notifications', action: 'Publish', code: 'Notifications.Publish' },
  DELETE: { module: 'Notifications', action: 'Delete', code: 'Notifications.Delete' },
  MANAGE_SETTINGS: { module: 'Notifications', action: 'Manage Settings', code: 'Notifications.ManageSettings' },
};

export const SYSTEM_PERMISSIONS = {
  MANAGE_JOBS: { module: 'System', action: 'Manage Jobs', code: 'System.ManageJobs' },
  ADMINISTRATOR: { module: 'System', action: 'Administrator', code: 'System.Administrator' },
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

export const REQUEST_OUTCOME = {
  CREATED: 1,
  ALREADY_SENT: 2,
  SKIPPED: 3,
};

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

export const FIRST_CUSTOM_TYPE_KEY = 1000;

export const BELL_POLL_MS = 60_000;

export const MAX_PAGE_SIZE = 200;

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
