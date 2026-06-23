import { WORKFLOW_STATUS } from '../constants/statuses';
import { ROLES } from '../constants/roles';

export const mockWorkflows = [
  {
    id: 'wf-001',
    name: 'BOQ Approval Workflow',
    entity: 'boq',
    description: 'Standard approval workflow for Bill of Quantities items requiring sequential review by BU Head before invoicing can begin.',
    status: WORKFLOW_STATUS.ACTIVE,
    steps: [
      {
        id: 'wf-001-step-01',
        name: 'Project Manager Review',
        role: ROLES.PROJECT_MANAGER,
        action: 'review',
        order: 1,
        transitions: [
          { to: 'wf-001-step-02', condition: 'approved' },
          { to: null, condition: 'rejected' },
        ],
      },
      {
        id: 'wf-001-step-02',
        name: 'Invoicing Team Verification',
        role: ROLES.INVOICING_TEAM,
        action: 'verify',
        order: 2,
        transitions: [
          { to: 'wf-001-step-03', condition: 'approved' },
          { to: 'wf-001-step-01', condition: 'revision_requested' },
          { to: null, condition: 'rejected' },
        ],
      },
      {
        id: 'wf-001-step-03',
        name: 'BU Head Approval',
        role: ROLES.BU_HEAD,
        action: 'approve',
        order: 3,
        transitions: [
          { to: null, condition: 'approved' },
          { to: 'wf-001-step-01', condition: 'revision_requested' },
          { to: null, condition: 'rejected' },
        ],
      },
    ],
    notifications: [
      {
        trigger: 'step_assigned',
        recipients: ['assignee'],
        template: 'boq_step_assigned',
      },
      {
        trigger: 'approved',
        recipients: ['submitter', 'project_manager'],
        template: 'boq_approved',
      },
      {
        trigger: 'rejected',
        recipients: ['submitter', 'project_manager'],
        template: 'boq_rejected',
      },
      {
        trigger: 'revision_requested',
        recipients: ['submitter'],
        template: 'boq_revision_requested',
      },
      {
        trigger: 'sla_warning',
        recipients: ['assignee', 'bu_head'],
        template: 'sla_warning',
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
  },

  {
    id: 'wf-002',
    name: 'Invoice Request Workflow',
    entity: 'invoice',
    description: 'Multi-step invoice approval workflow. High-value invoices (above SAR 500,000) require additional CRP compliance review.',
    status: WORKFLOW_STATUS.ACTIVE,
    steps: [
      {
        id: 'wf-002-step-01',
        name: 'Invoicing Team Initial Review',
        role: ROLES.INVOICING_TEAM,
        action: 'review',
        order: 1,
        transitions: [
          { to: 'wf-002-step-02', condition: 'approved' },
          { to: null, condition: 'rejected' },
          { to: 'wf-002-step-01', condition: 'info_requested' },
        ],
      },
      {
        id: 'wf-002-step-02',
        name: 'CRP Compliance Check',
        role: ROLES.CRP,
        action: 'compliance_check',
        order: 2,
        transitions: [
          { to: 'wf-002-step-03', condition: 'approved' },
          { to: 'wf-002-step-01', condition: 'revision_requested' },
          { to: null, condition: 'rejected' },
        ],
      },
      {
        id: 'wf-002-step-03',
        name: 'BU Head Final Approval',
        role: ROLES.BU_HEAD,
        action: 'approve',
        order: 3,
        transitions: [
          { to: null, condition: 'approved' },
          { to: 'wf-002-step-01', condition: 'revision_requested' },
          { to: null, condition: 'rejected' },
        ],
      },
    ],
    notifications: [
      {
        trigger: 'submitted',
        recipients: ['invoicing_team'],
        template: 'invoice_submitted_for_review',
      },
      {
        trigger: 'step_assigned',
        recipients: ['assignee'],
        template: 'invoice_step_assigned',
      },
      {
        trigger: 'approved',
        recipients: ['submitter', 'project_manager', 'bdm'],
        template: 'invoice_approved',
      },
      {
        trigger: 'rejected',
        recipients: ['submitter', 'project_manager'],
        template: 'invoice_rejected',
      },
      {
        trigger: 'info_requested',
        recipients: ['submitter'],
        template: 'invoice_info_requested',
      },
      {
        trigger: 'sla_warning',
        recipients: ['assignee', 'bu_head'],
        template: 'sla_warning',
      },
      {
        trigger: 'sla_breach',
        recipients: ['assignee', 'bu_head', 'admin'],
        template: 'sla_breach_escalation',
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-04-10T14:00:00Z',
  },

  {
    id: 'wf-003',
    name: 'Project Creation Workflow',
    entity: 'project',
    description: 'Approval workflow for new project creation requests, ensuring BDM and BU Head sign-off before a project is made active in the system.',
    status: WORKFLOW_STATUS.DRAFT,
    steps: [
      {
        id: 'wf-003-step-01',
        name: 'BDM Validation',
        role: ROLES.BDM,
        action: 'validate',
        order: 1,
        transitions: [
          { to: 'wf-003-step-02', condition: 'approved' },
          { to: null, condition: 'rejected' },
        ],
      },
      {
        id: 'wf-003-step-02',
        name: 'DRM Commercial Review',
        role: ROLES.DRM,
        action: 'review',
        order: 2,
        transitions: [
          { to: 'wf-003-step-03', condition: 'approved' },
          { to: 'wf-003-step-01', condition: 'revision_requested' },
          { to: null, condition: 'rejected' },
        ],
      },
      {
        id: 'wf-003-step-03',
        name: 'BU Head Final Approval',
        role: ROLES.BU_HEAD,
        action: 'approve',
        order: 3,
        transitions: [
          { to: null, condition: 'approved' },
          { to: 'wf-003-step-01', condition: 'revision_requested' },
          { to: null, condition: 'rejected' },
        ],
      },
    ],
    notifications: [
      {
        trigger: 'created',
        recipients: ['bdm'],
        template: 'project_created_pending_review',
      },
      {
        trigger: 'step_assigned',
        recipients: ['assignee'],
        template: 'project_step_assigned',
      },
      {
        trigger: 'approved',
        recipients: ['project_manager', 'bdm', 'drm', 'admin'],
        template: 'project_approved',
      },
      {
        trigger: 'rejected',
        recipients: ['project_manager', 'bdm'],
        template: 'project_rejected',
      },
      {
        trigger: 'revision_requested',
        recipients: ['project_manager'],
        template: 'project_revision_requested',
      },
    ],
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
];

/**
 * Get a workflow by ID.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getWorkflowById(id) {
  return mockWorkflows.find((w) => w.id === id);
}

/**
 * Get the active workflow for a given entity type.
 * @param {'boq'|'invoice'|'project'} entity
 * @returns {object|undefined}
 */
export function getActiveWorkflowForEntity(entity) {
  return mockWorkflows.find(
    (w) => w.entity === entity && w.status === WORKFLOW_STATUS.ACTIVE
  );
}
