import { allow, WORKFLOW_PERMISSIONS } from '@/constants/workflowPermissions';
import { ROUTES } from '@/constants/routes';

export const WORKFLOW_ADMIN_TABS = [
  { href: ROUTES.WORKFLOW, label: 'Workflows', permissions: [WORKFLOW_PERMISSIONS.VIEW] },
  { href: ROUTES.WORKFLOW_FIELDS, label: 'Fields', permissions: [WORKFLOW_PERMISSIONS.MANAGE] },
  { href: ROUTES.WORKFLOW_LIMITS, label: 'Engine limits', permissions: [WORKFLOW_PERMISSIONS.MANAGE] },
  { href: ROUTES.WORKFLOW_DOMAINS, label: 'Approved domains', permissions: [WORKFLOW_PERMISSIONS.MANAGE] },
];

export const canOpenWorkflowTab = (can, tab) => tab.permissions.some((p) => allow(can, p));

export const WORKFLOW_ADMIN_PERMISSIONS = [WORKFLOW_PERMISSIONS.VIEW, WORKFLOW_PERMISSIONS.MANAGE];
