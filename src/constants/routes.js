export const ROUTES = {
  // Dashboard
  DASHBOARD: '/dashboard',

  // Projects
  PROJECTS: '/projects',
  PROJECTS_NEW: '/projects/new',
  PROJECT_DETAIL: (id) => `/projects/${id}`,
  PROJECT_EDIT: (id) => `/projects/${id}/edit`,

  // BOQ (nested under a project — no standalone BOQ module)
  PROJECT_BOQ: (id) => `/projects/${id}/boq`,
  PROJECT_BOQ_NEW: (id) => `/projects/${id}/boq/new`,
  // Read-only, so it can be linked to from anywhere — a workflow run tracking
  // BOQ items sends readers here rather than into the edit form.
  PROJECT_BOQ_ITEM: (id, itemId) => `/projects/${id}/boq/${itemId}`,
  PROJECT_BOQ_EDIT: (id, itemId) => `/projects/${id}/boq/${itemId}/edit`,

  // Change requests (2026-10-18): the project page's tab, and the form.
  PROJECT_CHANGE_REQUESTS: (id) => `/projects/${id}?tab=change-requests`,
  PROJECT_CHANGE_REQUEST_NEW: (id) => `/projects/${id}/change-requests/new`,
  PROJECT_CHANGE_REQUEST: (id, crId) => `/projects/${id}/change-requests/${crId}`,
  PROJECT_CHANGE_REQUEST_EDIT: (id, crId) => `/projects/${id}/change-requests/${crId}/edit`,

  // Invoices (creation and editing nested under a project — no standalone
  // "new"/"edit" routes; detail stays top-level since it's also reachable
  // from the global invoices list)
  INVOICES: '/invoices',
  PROJECT_INVOICE_NEW: (id) => `/projects/${id}/invoices/new`,
  PROJECT_INVOICE_EDIT: (id, invoiceId) => `/projects/${id}/invoices/${invoiceId}/edit`,
  INVOICE_DETAIL: (id) => `/invoices/${id}`,

  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ROLES: '/admin/roles',
  ADMIN_SETTINGS: '/admin/settings',

  // Workflow — the person's own to-do list stays outside Admin
  WORKFLOW_TASKS: '/workflow/tasks',

  // Admin › Workflow (2026-10-13): the workflows, their builder, the fields the
  // builder shows, and the engine. /workflow and /workflow/builder redirect here;
  // see next.config.mjs.
  WORKFLOW_ADMIN: '/admin/workflow',
  WORKFLOW: '/admin/workflow/workflows',
  WORKFLOW_BUILDER: '/admin/workflow/builder',
  // Which fields the builder shows, by what name, and which a task can fill.
  WORKFLOW_FIELDS: '/admin/workflow/fields',
  // The engine's limits and the hosts its API calls may reach — one page until
  // later on 2026-10-13, so /admin/workflow/engine redirects to the limits.
  WORKFLOW_LIMITS: '/admin/workflow/limits',
  WORKFLOW_DOMAINS: '/admin/workflow/domains',

  // Admin › Monitoring — watching what the system does, across modules. The
  // older addresses (/workflow/runs, /trace, /admin/notifications/monitor and
  // /audit, /admin/workflow/changes) redirect here; see next.config.mjs.
  MONITORING: '/admin/monitoring',
  MONITORING_RUNS: '/admin/monitoring/runs',
  MONITORING_RUN: (instanceId) => `/admin/monitoring/runs/${instanceId}`,
  MONITORING_DELIVERIES: '/admin/monitoring/deliveries',
  MONITORING_DELIVERY: (notificationId) => `/admin/monitoring/deliveries/${notificationId}`,
  // Everything one tracking number caused. Takes the number as `?id=` so an
  // error screen or a notification can link straight to it.
  MONITORING_TRACE: (correlationId) =>
    (correlationId ? `/admin/monitoring/trace?id=${encodeURIComponent(correlationId)}` : '/admin/monitoring/trace'),
  // Who changed what. `view` opens one part: 'requests', 'notifications' or 'workflow'.
  MONITORING_AUDIT: (view) => (view ? `/admin/monitoring/audit?view=${view}` : '/admin/monitoring/audit'),

  // Background jobs, every module's
  BACKGROUND_JOBS: '/admin/jobs',

  // Notifications — the person's own inbox
  NOTIFICATIONS: '/notifications',

  // Notifications — admin
  NOTIFICATION_TYPES: '/admin/notifications/types',
  NOTIFICATION_TYPE_DETAIL: (id) => `/admin/notifications/types/${id}`,
  NOTIFICATION_SENDERS: '/admin/notifications/senders',
  NOTIFICATION_SETTINGS: '/admin/notifications/settings',

  // Reports
  REPORTS: '/reports',

  // Auth
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',
};

/**
 * Static route patterns for Next.js App Router (used for matching/middleware).
 */
export const ROUTE_PATTERNS = {
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECTS_NEW: '/projects/new',
  PROJECT_DETAIL: '/projects/[id]',
  PROJECT_EDIT: '/projects/[id]/edit',
  PROJECT_BOQ: '/projects/[id]/boq',
  PROJECT_BOQ_NEW: '/projects/[id]/boq/new',
  PROJECT_BOQ_ITEM: '/projects/[id]/boq/[itemId]',
  PROJECT_BOQ_EDIT: '/projects/[id]/boq/[itemId]/edit',
  PROJECT_CHANGE_REQUEST_NEW: '/projects/[id]/change-requests/new',
  PROJECT_CHANGE_REQUEST: '/projects/[id]/change-requests/[crId]',
  PROJECT_CHANGE_REQUEST_EDIT: '/projects/[id]/change-requests/[crId]/edit',
  INVOICES: '/invoices',
  PROJECT_INVOICE_NEW: '/projects/[id]/invoices/new',
  PROJECT_INVOICE_EDIT: '/projects/[id]/invoices/[invoiceId]/edit',
  INVOICE_DETAIL: '/invoices/[id]',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ROLES: '/admin/roles',
  ADMIN_SETTINGS: '/admin/settings',
  WORKFLOW_TASKS: '/workflow/tasks',
  WORKFLOW_ADMIN: '/admin/workflow',
  WORKFLOW: '/admin/workflow/workflows',
  WORKFLOW_BUILDER: '/admin/workflow/builder',
  WORKFLOW_FIELDS: '/admin/workflow/fields',
  WORKFLOW_LIMITS: '/admin/workflow/limits',
  WORKFLOW_DOMAINS: '/admin/workflow/domains',
  MONITORING: '/admin/monitoring',
  MONITORING_RUNS: '/admin/monitoring/runs',
  MONITORING_RUN: '/admin/monitoring/runs/[instanceId]',
  MONITORING_DELIVERIES: '/admin/monitoring/deliveries',
  MONITORING_DELIVERY: '/admin/monitoring/deliveries/[notificationId]',
  MONITORING_TRACE: '/admin/monitoring/trace',
  MONITORING_AUDIT: '/admin/monitoring/audit',
  BACKGROUND_JOBS: '/admin/jobs',
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_TYPES: '/admin/notifications/types',
  NOTIFICATION_TYPE_DETAIL: '/admin/notifications/types/[typeId]',
  NOTIFICATION_SENDERS: '/admin/notifications/senders',
  NOTIFICATION_SETTINGS: '/admin/notifications/settings',
  REPORTS: '/reports',
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',
};

/**
 * Public routes that do not require authentication.
 */
export const PUBLIC_ROUTES = [ROUTES.LOGIN, ROUTES.UNAUTHORIZED];
