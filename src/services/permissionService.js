import { ROLE_PERMISSIONS } from '@/constants/permissions';

/**
 * Collect all permissions granted to an array of roles.
 * Duplicates are removed so the result is a unique set.
 *
 * @param {string[]} userRoles
 * @returns {string[]}
 */
export function getUserPermissions(userRoles) {
  if (!Array.isArray(userRoles) || userRoles.length === 0) return [];

  const permSet = new Set();
  for (const role of userRoles) {
    const rolePerms = ROLE_PERMISSIONS[role];
    if (Array.isArray(rolePerms)) {
      for (const perm of rolePerms) {
        permSet.add(perm);
      }
    }
  }
  return [...permSet];
}

/**
 * Check whether any of the given roles grants the specified permission.
 *
 * @param {string[]} userRoles
 * @param {string}   permission
 * @returns {boolean}
 */
export function hasPermission(userRoles, permission) {
  if (!Array.isArray(userRoles) || !permission) return false;
  const perms = getUserPermissions(userRoles);
  return perms.includes(permission);
}

/**
 * Check whether any of the given roles grants AT LEAST ONE of the
 * specified permissions (OR logic).
 *
 * @param {string[]} userRoles
 * @param {string[]} permissions
 * @returns {boolean}
 */
export function hasAnyPermission(userRoles, permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) return false;
  return permissions.some((perm) => hasPermission(userRoles, perm));
}

/**
 * Check whether any of the given roles grants ALL of the specified
 * permissions (AND logic).
 *
 * @param {string[]} userRoles
 * @param {string[]} permissions
 * @returns {boolean}
 */
export function hasAllPermissions(userRoles, permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) return false;
  return permissions.every((perm) => hasPermission(userRoles, perm));
}

export const permissionService = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
};
