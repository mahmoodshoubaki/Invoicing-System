import { createApiClient } from '@/lib/apiClient';
import { fetchAllPages } from '@/lib/fetchAllPages';
import {
  createProject, mapProjectListItem, mapMainProjectDetails, mapSubProjectSummary, mapProjectHeader,
} from '@/models/project';

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

  /**
   * The project's header: names, contract dates, value, its three people and
   * whether it has a main project. Null when the user may not see it.
   *
   * @param {string} projectCode
   * @returns {Promise<Object|null>}  mapProjectHeader's
   */
  async getProjectHeader(projectCode) {
    const raw = await api.get('/GetProjectHeader', { projectCode });
    return raw ? mapProjectHeader(raw) : null;
  },

  /** Every EPM project status, like "In Progress" — what a status filter offers. */
  async getProjectStatuses() {
    const data = await api.get('/GetProjectStatuses');
    return Array.isArray(data) ? data.filter(Boolean) : [];
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

  /**
   * One page of the user's projects, searched and filtered by the server.
   * `statuses` is every status the user's projects have, whatever the filter.
   *
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

  // REAL API
  async getProjects({ search = '', status = '' } = {}) {
    return fetchAllPages(async (skip, take) => {
      const page = await projectRepository.getProjectsPage({ search, status, skip, take });
      return { rows: page.projects, total: page.total };
    });
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
