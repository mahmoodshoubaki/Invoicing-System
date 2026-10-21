import { createApiClient } from '@/lib/apiClient';
import { createProject, mapProjectListItem, mapMainProjectDetails, mapSubProjectSummary } from '@/models/project';

const api = createApiClient('/api/Projects');

export const projectRepository = {

  // REAL API
  async getProject(id) {
    const raw = await api.get(`/GetProjectDetails?projectUID=${id}`);
    return createProject(raw);
  },

  /**
   * One project's EPM details by its code (2026-10-21) — `GetProjectDetails`
   * takes `projectCode`. The only call that names its people: its CRP, BU
   * head and BDM, by display name. With several sub-projects it answers with
   * one of them; null when the user may not see the project.
   *
   * @param {string} projectCode
   * @returns {Promise<Object|null>}  createProject's
   */
  async getProjectDetails(projectCode) {
    const raw = await api.get(`/GetProjectDetails?${new URLSearchParams({ projectCode }).toString()}`);
    return raw ? createProject(raw) : null;
  },

  // REAL API
  async getMainProjectDetails(projectCode) {
    const raw = await api.get(`/GetMainProjectDetails?${new URLSearchParams({ projectCode }).toString()}`);
    return mapMainProjectDetails(raw);
  },

  // REAL APIS
  async getSubProjectsSummary(projectCode) {
    const data = await api.get(`/GetSubProjectsSummary?${new URLSearchParams({ projectCode }).toString()}`);
    return data.map(mapSubProjectSummary);
  },

  // REAL API
  async getProjects(filters = {}) {
    const data = await api.get('/GetProjectsList');
    let result = data.map(mapProjectListItem);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.projectName?.toLowerCase().includes(q) ||
          p.clientName?.toLowerCase().includes(q) ||
          p.projectCode?.toLowerCase().includes(q) ||
          String(p.contractNumber ?? '').toLowerCase().includes(q)
      );
    }
    if (filters.status) result = result.filter((p) => p.status === filters.status);
    return result;
  },

  // TODO: wire up real endpoint
  async createProject(_data) {
    throw new Error('createProject: not implemented');
  },

  // TODO: wire up real endpoint
  async updateProject(_id, _data) {
    throw new Error('updateProject: not implemented');
  },

  // TODO: wire up real endpoint
  async deleteProject(_id) {
    throw new Error('deleteProject: not implemented');
  },

  // TODO: wire up real endpoint
  async archiveProject(_id) {
    throw new Error('archiveProject: not implemented');
  },

  // TODO: wire up real endpoint
  async getProjectStats() {
    throw new Error('getProjectStats: not implemented');
  },
};
