// REAL INTEGRATION POINT: Replace mock import and all method bodies with real
// API calls to your backend workflow management endpoints.
import { mockWorkflows } from '@/mock/workflows';
import { WORKFLOW_STATUS } from '@/constants/statuses';

/** In-memory mutable store — reset on each server/module reload. */
let workflows = [...mockWorkflows];

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

function generateId() {
  return `wf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const workflowRepository = {
  /**
   * Return all workflows.
   * @returns {Promise<object[]>}
   */
  async getWorkflows() {
    await delay(300);
    return workflows.map((w) => ({ ...w }));
  },

  /**
   * Return a single workflow by id.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getWorkflow(id) {
    await delay(200);
    const workflow = workflows.find((w) => w.id === id);
    if (!workflow) throw new Error(`Workflow not found: ${id}`);
    return { ...workflow };
  },

  /**
   * Create a new workflow.
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createWorkflow(data) {
    await delay(400);

    if (!data.name?.trim()) throw new Error('Workflow name is required.');
    if (!Array.isArray(data.steps) || data.steps.length === 0) {
      throw new Error('A workflow must have at least one step.');
    }

    const now = new Date().toISOString();
    const newWorkflow = {
      ...data,
      id: generateId(),
      status: data.status ?? WORKFLOW_STATUS.DRAFT,
      createdAt: now,
      updatedAt: now,
    };

    workflows.push(newWorkflow);
    return { ...newWorkflow };
  },

  /**
   * Update a workflow by id.
   * @param {string} id
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateWorkflow(id, data) {
    await delay(350);

    const idx = workflows.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error(`Workflow not found: ${id}`);

    workflows[idx] = {
      ...workflows[idx],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };

    return { ...workflows[idx] };
  },

  /**
   * Delete a workflow by id.
   * Active workflows cannot be deleted.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteWorkflow(id) {
    await delay(300);

    const idx = workflows.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error(`Workflow not found: ${id}`);

    if (workflows[idx].status === WORKFLOW_STATUS.ACTIVE) {
      throw new Error(
        'Cannot delete an active workflow. Deactivate it first.'
      );
    }

    workflows.splice(idx, 1);
  },

  /**
   * Activate a workflow (Draft/Inactive → Active).
   * @param {string} id
   * @returns {Promise<object>}
   */
  async activateWorkflow(id) {
    return workflowRepository.updateWorkflow(id, {
      status: WORKFLOW_STATUS.ACTIVE,
    });
  },

  /**
   * Deactivate a workflow (Active → Inactive).
   * @param {string} id
   * @returns {Promise<object>}
   */
  async deactivateWorkflow(id) {
    return workflowRepository.updateWorkflow(id, {
      status: WORKFLOW_STATUS.INACTIVE,
    });
  },

  /**
   * Return the active workflow for a given entity type.
   * @param {'boq'|'invoice'|'project'} entity
   * @returns {Promise<object|null>}
   */
  async getActiveWorkflowForEntity(entity) {
    await delay(200);
    const found = workflows.find(
      (w) => w.entity === entity && w.status === WORKFLOW_STATUS.ACTIVE
    );
    return found ? { ...found } : null;
  },
};
