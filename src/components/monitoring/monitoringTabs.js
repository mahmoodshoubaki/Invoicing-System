import { NOTIFICATION_PERMISSIONS } from '@/constants/notifications';
import { allow, WORKFLOW_INSTANCE_PERMISSIONS, WORKFLOW_PERMISSIONS } from '@/constants/workflowPermissions';
import { ROUTES } from '@/constants/routes';

/**
 * Admin › Monitoring's pages: watching what the system does, across modules.
 * Each lists what READING it needs — any one of `permissions` will do. The tab
 * bar, the landing redirect and the sidebar entry all read this, so they cannot
 * disagree about who may open what.
 */
export const MONITORING_TABS = [
  { href: ROUTES.MONITORING_RUNS, label: 'Workflow runs', permissions: [WORKFLOW_INSTANCE_PERMISSIONS.VIEW] },
  { href: ROUTES.MONITORING_DELIVERIES, label: 'Notifications Delivery Monitor', permissions: [NOTIFICATION_PERMISSIONS.MANAGE_SETTINGS] },
  // The backend serves the trace under the workflow-runs permission.
  { href: ROUTES.MONITORING_TRACE(), label: 'Trace', permissions: [WORKFLOW_INSTANCE_PERMISSIONS.VIEW] },
  // Two sources, each its own permission; the page shows whichever may be read.
  { href: ROUTES.MONITORING_AUDIT(), label: 'Audit', permissions: [NOTIFICATION_PERMISSIONS.MANAGE_SETTINGS, WORKFLOW_PERMISSIONS.MANAGE] },
];

/** Whether this person may open a tab. */
export const canOpenTab = (can, tab) => tab.permissions.some((p) => allow(can, p));

/** Everything that opens some part of Monitoring — for the sidebar entry and the route guard. */
export const MONITORING_PERMISSIONS = [
  WORKFLOW_INSTANCE_PERMISSIONS.VIEW,
  NOTIFICATION_PERMISSIONS.MANAGE_SETTINGS,
  WORKFLOW_PERMISSIONS.MANAGE,
];
