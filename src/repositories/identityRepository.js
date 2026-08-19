import { createApiClient } from '@/lib/apiClient';
import { createPermission } from '@/models/permission';
import { mapRole, createRolePayload, updateRolePayload } from '@/models/role';
import { mapUser, updateUserPayload, createUserPayload, mapUnregisteredADUser, mapMe } from '@/models/user';

const api = createApiClient('/api/Identity');

export const identityRepository = {
  /**
   * Return the current user's profile and capabilities in one call — the
   * only way to know who's logged in now that the access token is an
   * httpOnly cookie the frontend can't read or decode.
   * @returns {Promise<{ user: object, capabilities: object }>}
   */
  async getMe() {
    const data = await api.get('/me');
    return {
      user: mapMe(data),
      capabilities: data?.modules ?? {},
    };
  },

  /**
   * Return the full catalog of permissions that exist in the system —
   * used to build the role-permission editor. Not the same as capabilities:
   * this is every permission that *could* be granted, not what the current
   * user actually holds.
   * @returns {Promise<object[]>}
   */
  async getAllPermissions() {
    const data = await api.get('/GetAllPermissions');
    return (data ?? []).map(createPermission);
  },

  /**
   * Return every role defined in the system, each with the permission
   * codes it currently grants.
   * @returns {Promise<object[]>}
   */
  async getAllRoles() {
    const data = await api.get('/GetAllRoles');
    return (data ?? []).map(mapRole);
  },

  /**
   * Update a role's description and the set of permissions it grants.
   * @param {object} data  { name, description, permissionCodes }
   * @returns {Promise<boolean>}
   */
  async updateRole(data) {
    const response = await api.post('/UpdateRole', updateRolePayload(data));
    return response?.success === true;
  },

  /**
   * Create a new role with an initial set of permissions.
   * @param {object} data  { name, description, permissionCodes }
   * @returns {Promise<string>} the new role's id
   */
  async createRole(data) {
    const response = await api.post('/CreateRole', createRolePayload(data));
    return response?.RoleId ?? null;
  },

  /**
   * Delete a role by id.
   * @param {string} roleId
   * @returns {Promise<boolean>}
   */
  async deleteRole(roleId) {
    const response = await api.post(`/DeleteRole?RoleId=${encodeURIComponent(roleId)}`);
    return response?.Success === true;
  },

  /**
   * Return every user authorized to access the system, with the role ids
   * assigned to each.
   * @returns {Promise<object[]>}
   */
  async getAuthorizedUsers() {
    const data = await api.get('/GetAuthorizedUsers');
    return (data ?? []).map(mapUser);
  },

  /**
   * Update a user's active status and role assignments. Also used for
   * activating/deactivating a user — send the full user with just
   * isActive flipped.
   * @param {object} data  { displayName, isActive, roleIds }
   * @returns {Promise<boolean>}
   */
  async updateUser(data) {
    const response = await api.post('/UpdateUser', updateUserPayload(data));
    return response?.Success === true;
  },

  /**
   * Create a new user with an initial set of roles.
   * @param {object} data  { displayName, roleIds }
   * @returns {Promise<boolean>}
   */
  async createUser(data) {
    const response = await api.post('/CreateUser', createUserPayload(data));
    return response?.Success === true;
  },

  /**
   * Return AD users not yet registered in the system — candidates to
   * pick from when adding a new user.
   * @returns {Promise<object[]>}
   */
  async getUnregisteredADUsers() {
    const data = await api.get('/GetUnregisteredADUsers');
    return (data ?? []).map(mapUnregisteredADUser);
  },
};
