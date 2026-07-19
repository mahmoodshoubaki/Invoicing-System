import { createApiClient } from '@/lib/apiClient';
import { createProject } from '@/models/project';

const api = createApiClient('/api/Projects');

export const projectRepository = {

  // REAL API
  async getProject(id) {
    const raw = await api.get(`/GetProjectDetails?projectUID=${id}`);
    return createProject(raw);
  },

  // REAL API
  async getProjects(filters = {}) {
    const data = await api.get('/GetAllProjectsDetails');
    let result = data.map(createProject);
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
    if (filters.status)       result = result.filter((p) => p.status === filters.status);
    if (filters.businessUnit) result = result.filter((p) => p.businessUnit === filters.businessUnit);
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
