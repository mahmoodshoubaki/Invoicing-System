import { NOTIFICATION_PERMISSIONS } from '@/constants/notifications';
import { ROUTES } from '@/constants/routes';

/**
 * The notifications admin area's pages, each with what READING it needs.
 * The tab bar and the landing redirect both read this, so they cannot
 * disagree about who may open what.
 *
 * Delivery monitor, Trace and Audit moved to Admin › Monitoring (2026-10-08),
 * beside the workflow runs they so often explain.
 */
export const NOTIFICATION_ADMIN_TABS = [
  { href: ROUTES.NOTIFICATION_TYPES, label: 'Types & templates', permission: NOTIFICATION_PERMISSIONS.VIEW },
  { href: ROUTES.NOTIFICATION_SENDERS, label: 'Email senders', permission: NOTIFICATION_PERMISSIONS.MANAGE },
  { href: ROUTES.NOTIFICATION_SETTINGS, label: 'Settings', permission: NOTIFICATION_PERMISSIONS.MANAGE },
];
