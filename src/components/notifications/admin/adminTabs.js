import { NOTIFICATION_PERMISSIONS } from '@/constants/notifications';
import { ROUTES } from '@/constants/routes';

export const NOTIFICATION_ADMIN_TABS = [
  { href: ROUTES.NOTIFICATION_TYPES, label: 'Types & templates', permission: NOTIFICATION_PERMISSIONS.VIEW },
  { href: ROUTES.NOTIFICATION_SENDERS, label: 'Email senders', permission: NOTIFICATION_PERMISSIONS.MANAGE },
  { href: ROUTES.NOTIFICATION_SETTINGS, label: 'Settings', permission: NOTIFICATION_PERMISSIONS.MANAGE },
];
