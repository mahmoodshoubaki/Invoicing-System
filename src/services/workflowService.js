import { workflowRepository } from '@/repositories/workflowRepository';

/**
 * workflowService — workflow engine that drives step-based approval flows.
 *
 * Works with the workflow shape defined in mock/workflows.js:
 *   { id, name, entity, status, steps: [{ id, role, action, order, transitions }] }
 */
export const workflowService = {
  /**
   * Return all workflows.
   * @returns {Promise<object[]>}
   */
  async getWorkflows() {
    return workflowRepository.getWorkflows();
  },

  /**
   * Return the active workflow for a given entity type.
   * @param {'boq'|'invoice'|'project'} entity
   * @returns {Promise<object|null>}
   */
  async getActiveWorkflowForEntity(entity) {
    return workflowRepository.getActiveWorkflowForEntity(entity);
  },

  /**
   * Create a workflow after validating its structure.
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createWorkflow(data) {
    workflowService._validateWorkflow(data);
    return workflowRepository.createWorkflow(data);
  },

  /**
   * Update an existing workflow.
   * @param {string} id
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateWorkflow(id, data) {
    if (data.steps) {
      workflowService._validateWorkflow({ ...data, name: data.name ?? 'temp' });
    }
    return workflowRepository.updateWorkflow(id, data);
  },

  /**
   * Delete a workflow (only Draft/Inactive workflows can be deleted).
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteWorkflow(id) {
    return workflowRepository.deleteWorkflow(id);
  },

  /**
   * Toggle a workflow between Active and Inactive.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async toggleWorkflowStatus(id) {
    const workflow = await workflowRepository.getWorkflow(id);
    if (workflow.status === 'Active') {
      return workflowRepository.deactivateWorkflow(id);
    }
    return workflowRepository.activateWorkflow(id);
  },

  // ---------------------------------------------------------------------------
  // Workflow engine methods
  // ---------------------------------------------------------------------------

  /**
   * Evaluate a workflow step action and determine the outcome.
   * Returns { nextStep, isComplete, isRejected } describing the transition result.
   *
   * @param {object} workflow     Full workflow object with steps array.
   * @param {string} currentStepId  ID of the current step being acted upon.
   * @param {string} action       The action taken (e.g., 'approved', 'rejected').
   * @param {object} user         The acting user object (for audit; not checked here).
   * @returns {{ nextStep: object|null, isComplete: boolean, isRejected: boolean }}
   */
  evaluateWorkflowStep(workflow, currentStepId, action, user) {
    if (!workflow?.steps?.length) {
      throw new Error('Workflow has no steps defined.');
    }

    const currentStep = workflow.steps.find((s) => s.id === currentStepId);
    if (!currentStep) {
      throw new Error(`Step "${currentStepId}" not found in workflow "${workflow.id}".`);
    }

    // Find the transition that matches the given action condition
    const transition = currentStep.transitions?.find((t) => t.condition === action);
    if (!transition) {
      throw new Error(
        `Action "${action}" is not a valid transition from step "${currentStep.name}".`
      );
    }

    // transition.to === null means the workflow is terminal (complete or rejected)
    if (transition.to === null) {
      const isRejected = action === 'rejected';
      return {
        nextStep: null,
        isComplete: !isRejected,
        isRejected,
      };
    }

    const nextStep = workflow.steps.find((s) => s.id === transition.to);
    if (!nextStep) {
      throw new Error(
        `Transition target step "${transition.to}" not found in workflow "${workflow.id}".`
      );
    }

    return {
      nextStep,
      isComplete: false,
      isRejected: false,
    };
  },

  /**
   * Determine the next step after an action without full evaluation.
   * Returns the next step object, or null if the workflow ends.
   *
   * @param {object} workflow
   * @param {string} currentStepId
   * @param {string} action
   * @returns {object|null}
   */
  getNextStep(workflow, currentStepId, action) {
    const result = workflowService.evaluateWorkflowStep(
      workflow,
      currentStepId,
      action,
      null
    );
    return result.nextStep;
  },

  /**
   * Return the list of valid action strings for a given step and user roles.
   * Filters transitions to those whose condition maps to an action the role is
   * permitted to take (determined by the step's role assignment).
   *
   * @param {object} workflow
   * @param {string} currentStepId
   * @param {string[]} userRoles
   * @returns {string[]}  Array of allowed action condition strings.
   */
  getAvailableActions(workflow, currentStepId, userRoles = []) {
    if (!workflow?.steps?.length) return [];

    const step = workflow.steps.find((s) => s.id === currentStepId);
    if (!step) return [];

    // Check that the user's roles include the step's required role
    if (!userRoles.includes(step.role)) {
      return []; // User is not assigned to this step
    }

    return (step.transitions || []).map((t) => t.condition);
  },

  /**
   * Return the first step of a workflow (entry point).
   * @param {object} workflow
   * @returns {object|null}
   */
  getFirstStep(workflow) {
    if (!workflow?.steps?.length) return null;
    const sorted = [...workflow.steps].sort((a, b) => a.order - b.order);
    return sorted[0] ?? null;
  },

  /**
   * Return the step a given user should currently act on, based on their roles.
   * Returns null if no matching step is found (e.g., already complete).
   *
   * @param {object} workflow
   * @param {string} currentStepId
   * @param {string[]} userRoles
   * @returns {object|null}
   */
  getUserCurrentStep(workflow, currentStepId, userRoles = []) {
    if (!currentStepId || !workflow?.steps?.length) return null;

    const step = workflow.steps.find((s) => s.id === currentStepId);
    if (!step) return null;

    // The step belongs to this user if their roles include the step's role
    return userRoles.includes(step.role) ? step : null;
  },

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Validate a workflow object structure.
   * @param {object} data
   */
  _validateWorkflow(data) {
    if (!data.name?.trim()) throw new Error('Workflow name is required.');
    if (!Array.isArray(data.steps) || data.steps.length === 0) {
      throw new Error('A workflow must have at least one step.');
    }

    data.steps.forEach((step, idx) => {
      if (!step.id) throw new Error(`Step at index ${idx} is missing an id.`);
      if (!step.name?.trim()) {
        throw new Error(`Step at index ${idx} is missing a name.`);
      }
      if (!step.role) {
        throw new Error(`Step "${step.name}" is missing a required role assignment.`);
      }
      if (!Array.isArray(step.transitions) || step.transitions.length === 0) {
        throw new Error(`Step "${step.name}" must have at least one transition.`);
      }
    });
  },
};
