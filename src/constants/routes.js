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
  PROJECT_BOQ_EDIT: (id, itemId) => `/projects/${id}/boq/${itemId}/edit`,

  // Invoices (creation nested under a project — no standalone "new" route)
  INVOICES: '/invoices',
  PROJECT_INVOICE_NEW: (id) => `/projects/${id}/invoices/new`,
  INVOICE_DETAIL: (id) => `/invoices/${id}`,

  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ROLES: '/admin/roles',
  ADMIN_WORKFLOW: '/admin/workflow',
  ADMIN_SETTINGS: '/admin/settings',

  // Workflow
  WORKFLOW: '/workflow',
  WORKFLOW_BUILDER: '/workflow/builder',

  // Notifications
  NOTIFICATIONS: '/notifications',

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
  PROJECT_BOQ_EDIT: '/projects/[id]/boq/[itemId]/edit',
  INVOICES: '/invoices',
  PROJECT_INVOICE_NEW: '/projects/[id]/invoices/new',
  INVOICE_DETAIL: '/invoices/[id]',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ROLES: '/admin/roles',
  ADMIN_WORKFLOW: '/admin/workflow',
  ADMIN_SETTINGS: '/admin/settings',
  WORKFLOW: '/workflow',
  WORKFLOW_BUILDER: '/workflow/builder',
  NOTIFICATIONS: '/notifications',
  REPORTS: '/reports',
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',
};

/**
 * Public routes that do not require authentication.
 */
export const PUBLIC_ROUTES = [ROUTES.LOGIN, ROUTES.UNAUTHORIZED];
