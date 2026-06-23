import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
} from '@/services/permissionService';

/**
 * usePermission — derives permission utilities from the current user's roles.
 *
 * Returns:
 *   hasPermission(permission)           — boolean: user holds this permission
 *   hasAnyPermission(permissions[])     — boolean: user holds at least one
 *   hasAllPermissions(permissions[])    — boolean: user holds all listed
 *   userPermissions                     — string[]: full flat list of granted permissions
 */
export function usePermission() {
  const { user } = useAuth();

  const userRoles = useMemo(() => {
    if (!user || !Array.isArray(user.roles)) return [];
    return user.roles;
  }, [user]);

  const userPermissions = useMemo(
    () => getUserPermissions(userRoles),
    [userRoles]
  );

  const checkPermission = useMemo(
    () => (permission) => hasPermission(userRoles, permission),
    [userRoles]
  );

  const checkAnyPermission = useMemo(
    () => (permissions) => hasAnyPermission(userRoles, permissions),
    [userRoles]
  );

  const checkAllPermissions = useMemo(
    () => (permissions) => hasAllPermissions(userRoles, permissions),
    [userRoles]
  );

  return {
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    userPermissions,
  };
}

export default usePermission;
