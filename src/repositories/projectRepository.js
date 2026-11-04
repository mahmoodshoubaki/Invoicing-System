import { createApiClient } from '@/lib/apiClient';
import { fetchAllPages } from '@/lib/fetchAllPages';
import {
  createProject, mapProjectListItem, mapMainProjectDetails, mapSubProjectSummary, mapProjectHeader,
} from '@/models/project';

const api = createApiClient('/api/Projects');

export const projectRepository = {

  async getProject(id) {
    const raw = await api.get(`/GetProjectDetails?projectUID=${id}`);
    return createProject(raw);
  },

  /**
   * @param {string} projectCode
   * @returns {Promise<Object|null>}
   */
  async getProjectDetails(projectCode) {
    const raw = await api.get(`/GetProjectDetails?${new URLSearchParams({ projectCode }).toString()}`);
    return raw ? createProject(raw) : null;
  },

  /**
   * @param {string} projectCode
   * @returns {Promise<Object|null>}
   */
  async getProjectHeader(projectCode) {
    const raw = await api.get('/GetProjectHeader', { projectCode });
    return raw ? mapProjectHeader(raw) : null;
  },

  async getProjectStatuses() {
    const data = await api.get('/GetProjectStatuses');
    return Array.isArray(data) ? data.filter(Boolean) : [];
  },

  async getMainProjectDetails(projectCode) {
    const raw = await api.get(`/GetMainProjectDetails?${new URLSearchParams({ projectCode }).toString()}`);
    return mapMainProjectDetails(raw);
  },

  async getSubProjectsSummary(projectCode) {
    const data = await api.get(`/GetSubProjectsSummary?${new URLSearchParams({ projectCode }).toString()}`);
    return data.map(mapSubProjectSummary);
  },

  /**
   * @param {{ search?: string, status?: string, skip: number, take: number }} query
   * @returns {Promise<{ projects: Object[], total: number, statuses: string[] }>}
   */
  async getProjectsPage({ search = '', status = '', skip, take }) {
    const params = { skip, take, ...(search ? { search } : {}), ...(status ? { status } : {}) };
    const page = await api.get('/GetProjectsList', params);
    return {
      projects: (page?.projects ?? []).map(mapProjectListItem),
      total: page?.total ?? 0,
      statuses: page?.statuses ?? [],
    };
  },

  async getProjects({ search = '', status = '' } = {}) {
    return fetchAllPages(async (skip, take) => {
      const page = await projectRepository.getProjectsPage({ search, status, skip, take });
      return { rows: page.projects, total: page.total };
    });
  },

  async createProject(_data) {
    throw new Error('createProject: not implemented');
  },

  async updateProject(_id, _data) {
    throw new Error('updateProject: not implemented');
  },

  async deleteProject(_id) {
    throw new Error('deleteProject: not implemented');
  },

  async archiveProject(_id) {
    throw new Error('archiveProject: not implemented');
  },

  async getProjectStats() {
    throw new Error('getProjectStats: not implemented');
  },
};
