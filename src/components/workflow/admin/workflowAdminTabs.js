import { allow, WORKFLOW_PERMISSIONS } from '@/constants/workflowPermissions';
import { ROUTES } from '@/constants/routes';

/**
 * Admin › Workflow's pages (2026-10-13): the workflows themselves, the fields
 * the builder shows, the engine's limits, and the hosts its API calls may
 * reach. Each lists what READING it needs. The tab bar, the landing redirect
 * and the sidebar entry all read this, so they cannot disagree about who may
 * open what.
 */
export const WORKFLOW_ADMIN_TABS = [
  { href: ROUTES.WORKFLOW, label: 'Workflows', permissions: [WORKFLOW_PERMISSIONS.VIEW] },
  { href: ROUTES.WORKFLOW_FIELDS, label: 'Fields', permissions: [WORKFLOW_PERMISSIONS.MANAGE] },
  { href: ROUTES.WORKFLOW_LIMITS, label: 'Engine limits', permissions: [WORKFLOW_PERMISSIONS.MANAGE] },
  { href: ROUTES.WORKFLOW_DOMAINS, label: 'Approved domains', permissions: [WORKFLOW_PERMISSIONS.MANAGE] },
];

/** Whether this person may open a tab. */
export const canOpenWorkflowTab = (can, tab) => tab.permissions.some((p) => allow(can, p));

/** Everything that opens some part of Admin › Workflow — for the sidebar entry. */
export const WORKFLOW_ADMIN_PERMISSIONS = [WORKFLOW_PERMISSIONS.VIEW, WORKFLOW_PERMISSIONS.MANAGE];
