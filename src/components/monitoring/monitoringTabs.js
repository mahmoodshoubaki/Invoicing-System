import { NOTIFICATION_PERMISSIONS } from '@/constants/notifications';
import { allow, WORKFLOW_INSTANCE_PERMISSIONS, WORKFLOW_PERMISSIONS } from '@/constants/workflowPermissions';
import { ROUTES } from '@/constants/routes';

export const MONITORING_TABS = [
  { href: ROUTES.MONITORING_RUNS, label: 'Workflow runs', permissions: [WORKFLOW_INSTANCE_PERMISSIONS.VIEW] },
  { href: ROUTES.MONITORING_DELIVERIES, label: 'Notifications Delivery Monitor', permissions: [NOTIFICATION_PERMISSIONS.MANAGE_SETTINGS] },
  { href: ROUTES.MONITORING_TRACE(), label: 'Trace', permissions: [WORKFLOW_INSTANCE_PERMISSIONS.VIEW] },
  { href: ROUTES.MONITORING_AUDIT(), label: 'Audit', permissions: [NOTIFICATION_PERMISSIONS.MANAGE_SETTINGS, WORKFLOW_PERMISSIONS.MANAGE] },
];

export const canOpenTab = (can, tab) => tab.permissions.some((p) => allow(can, p));

export const MONITORING_PERMISSIONS = [
  WORKFLOW_INSTANCE_PERMISSIONS.VIEW,
  NOTIFICATION_PERMISSIONS.MANAGE_SETTINGS,
  WORKFLOW_PERMISSIONS.MANAGE,
];
