import { projectRepository } from '@/repositories/projectRepository';
import { PROJECT_STATUS } from '@/constants/statuses';

/**
 * projectService — business logic layer on top of projectRepository.
 *
 * Adds validation, business rules, and computed/enriched fields before
 * delegating to the repository for persistence.
 */
export const projectService = {
  /**
   * Fetch all projects applying optional filters.
   * @param {object} filters
   * @returns {Promise<object[]>}
   */
  async getProjects(filters = {}) {
    const projects = await projectRepository.getProjects(filters);
    return projects.map(projectService._enrichProject);
  },

  /**
   * Fetch a single project by id with enriched fields.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getProject(id) {
    const project = await projectRepository.getProject(id);
    return projectService._enrichProject(project);
  },

  /**
   * Create a new project after validating required fields.
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createProject(data) {
    projectService._validateProjectData(data);

    const payload = {
      ...data,
      status: data.status ?? PROJECT_STATUS.ACTIVE,
      wip: data.wip ?? 0,
      totalRevenue: data.totalRevenue ?? 0,
      totalInvoices: data.totalInvoices ?? 0,
      collectedValue: data.collectedValue ?? 0,
      nonCollectedValue: data.nonCollectedValue ?? 0,
    };

    const created = await projectRepository.createProject(payload);
    return projectService._enrichProject(created);
  },

  /**
   * Update an existing project with validation.
   * @param {string} id
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateProject(id, data) {
    // Ensure project exists first
    await projectRepository.getProject(id);

    const updated = await projectRepository.updateProject(id, data);
    return projectService._enrichProject(updated);
  },

  /**
   * Delete a project. Only Archived projects can be deleted.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteProject(id) {
    const project = await projectRepository.getProject(id);

    if (project.status !== PROJECT_STATUS.ARCHIVED) {
      throw new Error(
        'Only Archived projects can be deleted. Archive the project first.'
      );
    }

    return projectRepository.deleteProject(id);
  },

  /**
   * Archive a project (Active | On Hold → Archived).
   * @param {string} id
   * @returns {Promise<object>}
   */
  async archiveProject(id) {
    const project = await projectRepository.getProject(id);

    if (project.status === PROJECT_STATUS.ARCHIVED) {
      throw new Error('Project is already archived.');
    }

    const updated = await projectRepository.archiveProject(id);
    return projectService._enrichProject(updated);
  },

  /**
   * Return aggregate project statistics.
   * @returns {Promise<object>}
   */
  async getProjectStats() {
    return projectRepository.getProjectStats();
  },

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Validate required fields for project creation.
   * Throws an Error with a descriptive message if validation fails.
   * @param {object} data
   */
  _validateProjectData(data) {
    const required = ['projectName', 'clientName', 'projectManager', 'startDate', 'endDate'];
    const missing = required.filter((field) => !data[field]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required project fields: ${missing.join(', ')}.`
      );
    }

    if (data.projectValue !== undefined && Number(data.projectValue) < 0) {
      throw new Error('Project value cannot be negative.');
    }

    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (end <= start) {
        throw new Error('Project end date must be after the start date.');
      }
    }
  },

  /**
   * Add computed/derived fields to a project object.
   * @param {object} project
   * @returns {object}
   */
  _enrichProject(project) {
    if (!project) return project;

    const collectionRate =
      project.totalRevenue > 0
        ? Math.round((project.collectedValue / project.totalRevenue) * 100)
        : 0;

    const remainingValue =
      (project.projectValue || 0) - (project.totalRevenue || 0);

    return {
      ...project,
      collectionRate,         // Percentage of revenue collected
      remainingValue,         // Contract value not yet recognised as revenue
      displayName: project.projectName || project.contractName || 'Unnamed Project',
    };
  },
};
