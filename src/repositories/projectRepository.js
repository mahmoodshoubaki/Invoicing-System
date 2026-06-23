// REAL INTEGRATION POINT: Replace mock import and all method bodies with real
// API calls using fetch/axios to your backend or Azure Functions endpoints.
// e.g.: const res = await fetch(`/api/projects?${new URLSearchParams(filters)}`);
import { mockProjects } from '@/mock/projects';

/** In-memory mutable store — reset on each server/module reload. */
let projects = [...mockProjects];

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

/** Generate a simple unique id. */
function generateId() {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const projectRepository = {
  /**
   * Return all projects, optionally filtered.
   * Supported filters: search (string), status (string), businessUnit (string)
   *
   * @param {Object} filters
   * @returns {Promise<object[]>}
   */
  async getProjects(filters = {}) {
    await delay(300);

    let result = [...projects];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.projectName?.toLowerCase().includes(q) ||
          p.clientName?.toLowerCase().includes(q) ||
          p.projectCode?.toLowerCase().includes(q) ||
          p.contractNumber?.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      result = result.filter((p) => p.status === filters.status);
    }

    if (filters.businessUnit) {
      result = result.filter((p) => p.businessUnit === filters.businessUnit);
    }

    return result;
  },

  /**
   * Find a single project by id.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getProject(id) {
    await delay(200);
    const project = projects.find((p) => p.id === id);
    if (!project) throw new Error(`Project not found: ${id}`);
    return { ...project };
  },

  /**
   * Create a new project.
   * @param {object} data  Partial project fields; id and timestamps are generated.
   * @returns {Promise<object>}
   */
  async createProject(data) {
    await delay(400);

    const now = new Date().toISOString();
    const newProject = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    projects.unshift(newProject);
    return { ...newProject };
  },

  /**
   * Update a project by id.
   * @param {string} id
   * @param {object} data  Partial fields to merge.
   * @returns {Promise<object>}
   */
  async updateProject(id, data) {
    await delay(350);

    const idx = projects.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Project not found: ${id}`);

    projects[idx] = {
      ...projects[idx],
      ...data,
      id,                                    // Prevent id from being overwritten
      updatedAt: new Date().toISOString(),
    };

    return { ...projects[idx] };
  },

  /**
   * Delete a project by id.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteProject(id) {
    await delay(300);

    const idx = projects.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Project not found: ${id}`);

    projects.splice(idx, 1);
  },

  /**
   * Set a project's status to 'Archived'.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async archiveProject(id) {
    return projectRepository.updateProject(id, { status: 'Archived' });
  },

  /**
   * Return aggregate statistics about the project list.
   * @returns {Promise<{ total: number, byStatus: object }>}
   */
  async getProjectStats() {
    await delay(200);

    const total = projects.length;
    const byStatus = projects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    const totalContractValue = projects.reduce(
      (sum, p) => sum + (p.projectValue || 0),
      0
    );

    const totalRevenue = projects.reduce(
      (sum, p) => sum + (p.totalRevenue || 0),
      0
    );

    return { total, byStatus, totalContractValue, totalRevenue };
  },
};
