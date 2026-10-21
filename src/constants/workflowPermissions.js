/**
 * Every capability check the workflow module makes, in one place.
 *
 * `can()` reads `capabilities[module][action]` from `Identity/me`'s `modules`
 * map, so the pair below is a permission row's **`module` + `name`** — NOT its
 * `code`. A row from GetAllPermissions looks like:
 *
 *   { name: "Manage", code: "Workflows.Manage", module: "Workflow" }
 *
 * so `Workflows.Manage` (the code, and what a role's `permissionCodes` carries)
 * is checked as `can('Workflow', 'Manage')`.
 *
 * Two things about this mapping are load-bearing and easy to get wrong. Both
 * are confirmed against a real `Identity/me` body, not inferred:
 *
 * 1. **The module is not derivable from the code prefix.** `boqs.*` → module
 *    "Boqs", `Roles.*` → "Role", `User.*` → "User", `Workflows.*` → "Workflow",
 *    while `WorkflowInstances.*` and `WorkflowTasks.*` keep their own modules.
 *    Read the `module` field; never infer it.
 *
 * 2. **The map is keyed by the display `name`, spaces included** — not by the
 *    code's suffix. Every permission predating the workflow module has the two
 *    identical, so nothing caught this before; three workflow rows break the
 *    tie and `me` returns them spelled out:
 *
 *      "Workflow":      { "Manage API Domains": true, … }
 *      "WorkflowTasks": { "Act On All": true, "View All": true, … }
 *
 *    So a capability's `action` is its `name` verbatim. `Workflows.ManageApiDomains`
 *    is checked as can('Workflow', 'Manage API Domains').
 */

/**
 * @typedef {Object} Capability
 * @property {string} module - the `module` field on the permission row
 * @property {string} action - the `name` field verbatim; the key inside `modules`
 * @property {string} code   - the backend permission code, for auditing
 */

/**
 * Workflow definitions — module "Workflow".
 * @type {Record<string, Capability>}
 */
export const WORKFLOW_PERMISSIONS = {
  VIEW: { module: 'Workflow', action: 'View', code: 'Workflows.View' },
  MANAGE: { module: 'Workflow', action: 'Manage', code: 'Workflows.Manage' },
  PUBLISH: { module: 'Workflow', action: 'Publish', code: 'Workflows.Publish' },
  RUN: { module: 'Workflow', action: 'Run', code: 'Workflows.Run' },

  /**
   * Deleting a draft version — `DeleteDefinition`, live since 2026-09-10.
   * A version that is published, or that anything has run, is kept rather than
   * deleted: WF-048.
   */
  DELETE: { module: 'Workflow', action: 'Delete', code: 'Workflows.Delete' },

  MANAGE_API_DOMAINS: {
    module: 'Workflow',
    action: 'Manage API Domains',
    code: 'Workflows.ManageApiDomains',
  },

  /**
   * Changing an engine limit. READING the settings is only `Manage` — this
   * guards the edit control alone, so somebody who may see the admin page need
   * not be able to change what the engine will tolerate.
   *
   * Spelled with spaces for the same reason as Manage API Domains: the
   * capability map is keyed by the display `name`, not by the code's suffix.
   */
  MANAGE_SETTINGS: {
    module: 'Workflow',
    action: 'Manage Settings',
    code: 'Workflows.ManageSettings',
  },
};

/**
 * Runs — module "WorkflowInstances".
 * @type {Record<string, Capability>}
 */
export const WORKFLOW_INSTANCE_PERMISSIONS = {
  VIEW: { module: 'WorkflowInstances', action: 'View', code: 'WorkflowInstances.View' },

  /**
   * Stopping a run — **both ways**.
   *
   * Guards `CancelInstance` (live 2026-09-10) *and* `PauseInstance` (2026-09-13),
   * so the two cannot be granted separately: anybody who may hold a run may
   * also end it. The names still mean opposite things to a user — a pause is
   * resumed exactly where it stopped, a cancel can only be started again from
   * the beginning — and the UI has to keep them apart even though the
   * permission does not.
   *
   * Running runs only, either way; anything else is WF-001.
   */
  CANCEL: { module: 'WorkflowInstances', action: 'Cancel', code: 'WorkflowInstances.Cancel' },
};

/**
 * Tasks — module "WorkflowTasks".
 *
 * `VIEW` is the user's own list; `VIEW_ALL` and `ACT_ALL` widen what the same
 * two endpoints return and allow, rather than guarding endpoints of their own —
 * so `GetMyTasks` and `CompleteTask` behave differently for whoever holds them.
 *
 * `REASSIGN` guards `ReassignTask` (live since 2026-09-10) and is deliberately
 * separate from `ACT_ALL`: covering for a colleague means passing their work
 * on, not deciding its outcome. There is no ownership check on it for exactly
 * that reason.
 *
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
 * Checks a capability.
 *
 *   const { can } = usePermission();
 *   if (allow(can, WORKFLOW_PERMISSIONS.PUBLISH)) { … }
 *
 * Thin on purpose: its value is that every workflow permission check names a
 * constant rather than two loose strings, so a renamed capability is one edit
 * here instead of a search across the module.
 *
 * @param {(module: string, action: string) => boolean} can
 * @param {Capability} capability
 * @returns {boolean}
 */
export function allow(can, capability) {
  return capability ? can(capability.module, capability.action) : false;
}

export default WORKFLOW_PERMISSIONS;
