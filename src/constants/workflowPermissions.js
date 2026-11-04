/**
 * @typedef {Object} Capability
 * @property {string} module
 * @property {string} action
 * @property {string} code
 */

/**
 * @type {Record<string, Capability>}
 */
export const WORKFLOW_PERMISSIONS = {
  VIEW: { module: 'Workflow', action: 'View', code: 'Workflows.View' },
  MANAGE: { module: 'Workflow', action: 'Manage', code: 'Workflows.Manage' },
  PUBLISH: { module: 'Workflow', action: 'Publish', code: 'Workflows.Publish' },
  RUN: { module: 'Workflow', action: 'Run', code: 'Workflows.Run' },

  DELETE: { module: 'Workflow', action: 'Delete', code: 'Workflows.Delete' },

  MANAGE_API_DOMAINS: {
    module: 'Workflow',
    action: 'Manage API Domains',
    code: 'Workflows.ManageApiDomains',
  },

  MANAGE_SETTINGS: {
    module: 'Workflow',
    action: 'Manage Settings',
    code: 'Workflows.ManageSettings',
  },
};

/**
 * @type {Record<string, Capability>}
 */
export const WORKFLOW_INSTANCE_PERMISSIONS = {
  VIEW: { module: 'WorkflowInstances', action: 'View', code: 'WorkflowInstances.View' },

  CANCEL: { module: 'WorkflowInstances', action: 'Cancel', code: 'WorkflowInstances.Cancel' },
};

/**
 * @type {Record<string, Capability>}
 */
export const WORKFLOW_TASK_PERMISSIONS = {
  VIEW: { module: 'WorkflowTasks', action: 'View', code: 'WorkflowTasks.View' },
  ACT: { module: 'WorkflowTasks', action: 'Act', code: 'WorkflowTasks.Act' },

  VIEW_ALL: {
    module: 'WorkflowTasks',
    action: 'View All',
    code: 'WorkflowTasks.ViewAll',
  },
  ACT_ALL: {
    module: 'WorkflowTasks',
    action: 'Act On All',
    code: 'WorkflowTasks.ActAll',
  },
  REASSIGN: { module: 'WorkflowTasks', action: 'Reassign', code: 'WorkflowTasks.Reassign' },
};

/**
 * @param {(module: string, action: string) => boolean} can
 * @param {Capability} capability
 * @returns {boolean}
 */
export const GROUP_PERMISSIONS = {
  VIEW: { module: 'Group', action: 'View', code: 'Groups.View' },
  MANAGE: { module: 'Group', action: 'Manage', code: 'Groups.Manage' },
};

export function allow(can, capability) {
  return capability ? can(capability.module, capability.action) : false;
}

export default WORKFLOW_PERMISSIONS;
