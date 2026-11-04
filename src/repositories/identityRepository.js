import { createApiClient } from '@/lib/apiClient';
import { createPermission } from '@/models/permission';
import { mapRole, createRolePayload, updateRolePayload } from '@/models/role';
import { mapGroup, createGroupPayload, updateGroupPayload } from '@/models/group';
import { mapUser, updateUserPayload, createUserPayload, mapUnregisteredADUser, mapMe } from '@/models/user';

const api = createApiClient('/api/Identity');

export const identityRepository = {
  /**
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
   * @returns {Promise<object[]>}
   */
  async getAllPermissions() {
    const data = await api.get('/GetAllPermissions');
    return (data ?? []).map(createPermission);
  },

  /**
   * @returns {Promise<object[]>}
   */
  async getAllRoles() {
    const data = await api.get('/GetAllRoles');
    return (data ?? []).map(mapRole);
  },

  /**
   * @param {object} data
   * @returns {Promise<boolean>}
   */
  async updateRole(data) {
    const response = await api.post('/UpdateRole', updateRolePayload(data));
    return response?.success === true;
  },

  /**
   * @param {object} data
   * @returns {Promise<string>}
   */
  async createRole(data) {
    const response = await api.post('/CreateRole', createRolePayload(data));
    return response?.roleId ?? null;
  },

  async getAllGroups() {
    const data = await api.get('/GetAllGroups');
    return (data ?? []).map(mapGroup);
  },

  /** @returns {Promise<string|null>} */
  async createGroup(data) {
    const response = await api.post('/CreateGroup', createGroupPayload(data));
    return response?.groupId ?? response?.GroupId ?? null;
  },

  async updateGroup(data) {
    const response = await api.post('/UpdateGroup', updateGroupPayload(data));
    return response?.success === true || response?.Success === true;
  },

  async deleteGroup(groupId) {
    const response = await api.post(`/DeleteGroup?groupId=${encodeURIComponent(groupId)}`);
    return response?.success === true || response?.Success === true;
  },

  /**
   * @param {string} roleId
   * @returns {Promise<boolean>}
   */
  async deleteRole(roleId) {
    const response = await api.post(`/DeleteRole?RoleId=${encodeURIComponent(roleId)}`);
    return response?.Success === true;
  },

  /**
   * @param {Object} [options]
   * @param {boolean} [options.includeInactive]
   * @param {string} [options.search]
   * @param {number} [options.take]
   * @param {string[]} [options.ids]
   * @returns {Promise<object[]>}
   */
  async getAuthorizedUsers({ includeInactive, search, take, ids } = {}) {
    const params = [];
    if (includeInactive) params.push(['includeInactive', 'true']);
    if (search) params.push(['search', search]);
    if (take != null) params.push(['take', String(take)]);
    for (const id of ids ?? []) params.push(['ids', id]);

    const data = await api.get('/GetAuthorizedUsers', params.length > 0 ? params : undefined);
    return (data ?? []).map(mapUser);
  },

  /**
   * @param {object} data
   * @returns {Promise<boolean>}
   */
  async updateUser(data) {
    const response = await api.post('/UpdateUser', updateUserPayload(data));
    return response?.Success === true;
  },

  /**
   * @param {object} data
   * @returns {Promise<boolean>}
   */
  async createUser(data) {
    const response = await api.post('/CreateUser', createUserPayload(data));
    return response?.Success === true;
  },

  /**
   * @param {{ search?: string, skip?: number, take: number }} query
   * @returns {Promise<{ users: object[], total: number }>}
   */
  async searchUnregisteredADUsers({ search = '', skip = 0, take }) {
    const params = { skip, take, ...(search ? { search } : {}) };
    const page = await api.get('/GetUnregisteredADUsers', params);
    return { users: (page?.users ?? []).map(mapUnregisteredADUser), total: page?.total ?? 0 };
  },
};
