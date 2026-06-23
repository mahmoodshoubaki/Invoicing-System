import { ROLES } from './roles';

export const PERMISSIONS = {
  // Project permissions
  PROJECT_READ: 'project.read',
  PROJECT_CREATE: 'project.create',
  PROJECT_EDIT: 'project.edit',
  PROJECT_DELETE: 'project.delete',

  // BOQ permissions
  BOQ_READ: 'boq.read',
  BOQ_CREATE: 'boq.create',
  BOQ_EDIT: 'boq.edit',
  BOQ_DELETE: 'boq.delete',
  BOQ_APPROVE: 'boq.approve',

  // Invoice permissions
  INVOICE_READ: 'invoice.read',
  INVOICE_SUBMIT: 'invoice.submit',
  INVOICE_APPROVE: 'invoice.approve',
  INVOICE_REJECT: 'invoice.reject',

  // Workflow permissions
  WORKFLOW_READ: 'workflow.read',
  WORKFLOW_MANAGE: 'workflow.manage',

  // Admin permissions
  ADMIN_MANAGE: 'admin.manage',
  ADMIN_USERS: 'admin.users',
  ADMIN_ROLES: 'admin.roles',

  // Notification permissions
  NOTIFICATION_READ: 'notification.read',

  // Report permissions
  REPORT_READ: 'report.read',
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ALL_PERMISSIONS,

  [ROLES.PROJECT_MANAGER]: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.BOQ_READ,
    PERMISSIONS.BOQ_CREATE,
    PERMISSIONS.BOQ_EDIT,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_SUBMIT,
    PERMISSIONS.NOTIFICATION_READ,
  ],

  [ROLES.INVOICING_TEAM]: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.BOQ_READ,
    PERMISSIONS.BOQ_APPROVE,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_APPROVE,
    PERMISSIONS.INVOICE_REJECT,
    PERMISSIONS.NOTIFICATION_READ,
  ],

  [ROLES.BDM]: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.BOQ_READ,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.REPORT_READ,
  ],

  [ROLES.DRM]: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.BOQ_READ,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.REPORT_READ,
  ],

  [ROLES.CRP]: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.BOQ_READ,
    PERMISSIONS.INVOICE_READ,
  ],

  [ROLES.BU_HEAD]: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.BOQ_READ,
    PERMISSIONS.BOQ_APPROVE,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_APPROVE,
    PERMISSIONS.REPORT_READ,
  ],

  [ROLES.VIEWER]: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.BOQ_READ,
    PERMISSIONS.INVOICE_READ,
  ],
};

/**
 * Check if a role has a specific permission.
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}

/**
 * Check if any of the given roles has a specific permission.
 * @param {string[]} roles
 * @param {string} permission
 * @returns {boolean}
 */
export function hasAnyRolePermission(roles, permission) {
  return roles.some((role) => hasPermission(role, permission));
}
