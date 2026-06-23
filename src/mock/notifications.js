export const NOTIFICATION_TYPES = {
  EMAIL: 'Email',
  SYSTEM: 'System',
};

export const NOTIFICATION_TRIGGERS = {
  INVOICE_SUBMITTED: 'invoice_submitted',
  INVOICE_APPROVED: 'invoice_approved',
  INVOICE_REJECTED: 'invoice_rejected',
  BOQ_APPROVED: 'boq_approved',
  BOQ_REVISION_REQUESTED: 'boq_revision_requested',
  SLA_WARNING: 'sla_warning',
  SLA_BREACH: 'sla_breach',
  PROJECT_CREATED: 'project_created',
  WORKFLOW_STEP_ASSIGNED: 'workflow_step_assigned',
  SYSTEM_ALERT: 'system_alert',
};

export const mockNotifications = [
  {
    id: 'notif-001',
    type: NOTIFICATION_TYPES.SYSTEM,
    trigger: NOTIFICATION_TRIGGERS.INVOICE_SUBMITTED,
    userId: 'usr-003',
    title: 'Invoice Submitted for Review',
    message:
      'Invoice INV-2024-001 (SAR 216,000) for project Digital Transformation Initiative has been submitted by Sara Al-Otaibi and is awaiting your review.',
    read: false,
    createdAt: '2024-05-28T10:05:00Z',
  },
  {
    id: 'notif-002',
    type: NOTIFICATION_TYPES.SYSTEM,
    trigger: NOTIFICATION_TRIGGERS.INVOICE_APPROVED,
    userId: 'usr-002',
    title: 'Invoice Approved by BU Head',
    message:
      'Invoice INV-2024-002 (SAR 126,000) for project ERP Implementation Phase 2 has been approved by Abdullah Al-Malik. It is now ready for client submission via Etimad.',
    read: true,
    createdAt: '2024-04-12T14:05:00Z',
  },
  {
    id: 'notif-003',
    type: NOTIFICATION_TYPES.SYSTEM,
    trigger: NOTIFICATION_TRIGGERS.INVOICE_REJECTED,
    userId: 'usr-002',
    title: 'Invoice Rejected — Action Required',
    message:
      'Invoice INV-2024-003 (SAR 240,000) for Cybersecurity Assessment has been rejected. Reason: Missing supporting documentation — please attach the signed delivery note.',
    read: false,
    createdAt: '2024-03-17T10:05:00Z',
  },
  {
    id: 'notif-004',
    type: NOTIFICATION_TYPES.SYSTEM,
    trigger: NOTIFICATION_TRIGGERS.SLA_WARNING,
    userId: 'usr-002',
    title: 'SLA Warning: BOQ Item Due in 7 Days',
    message:
      'BOQ item "SAP Finance Module Configuration" (boq-005) for project ERP Implementation Phase 2 is due for invoicing in 7 days on 2024-05-01. Please prepare the invoice request.',
    read: false,
    createdAt: '2024-04-24T08:00:00Z',
  },
  {
    id: 'notif-005',
    type: NOTIFICATION_TYPES.EMAIL,
    trigger: NOTIFICATION_TRIGGERS.SLA_BREACH,
    userId: 'usr-002',
    title: 'SLA Breach: BOQ Item Overdue — Escalation Level 1',
    message:
      'BOQ item "SAP Finance Module Configuration" (boq-005) is now 1 day overdue. Escalation Level 1 has been triggered. Your line manager has been notified. Please take immediate action to submit the invoice request.',
    read: false,
    createdAt: '2024-05-02T08:00:00Z',
  },
  {
    id: 'notif-006',
    type: NOTIFICATION_TYPES.SYSTEM,
    trigger: NOTIFICATION_TRIGGERS.BOQ_APPROVED,
    userId: 'usr-003',
    title: 'BOQ Item Approved — Ready for Invoicing',
    message:
      'BOQ item "Cloud Architecture Design & Assessment" (boq-001) for project Digital Transformation Initiative has been approved by Abdullah Al-Malik. You may now create an invoice request.',
    read: true,
    createdAt: '2024-03-10T09:05:00Z',
  },
  {
    id: 'notif-007',
    type: NOTIFICATION_TYPES.SYSTEM,
    trigger: NOTIFICATION_TRIGGERS.WORKFLOW_STEP_ASSIGNED,
    userId: 'usr-007',
    title: 'Action Required: Invoice Pending Your Approval',
    message:
      'Invoice INV-2025-001 (SAR 350,000) for Facilities Management Platform has passed Invoicing Team review and is now pending your final approval. SLA: 24 hours.',
    read: false,
    createdAt: '2025-03-08T11:00:00Z',
  },
  {
    id: 'notif-008',
    type: NOTIFICATION_TYPES.EMAIL,
    trigger: NOTIFICATION_TRIGGERS.PROJECT_CREATED,
    userId: 'usr-004',
    title: 'New Project Submitted for BDM Review',
    message:
      'A new project "HR Digital Transformation" (proj-007) for Ministry of Municipal and Rural Affairs has been submitted by Turki Al-Qarni. Please review and validate the project details before passing to DRM.',
    read: true,
    createdAt: '2025-01-05T09:30:00Z',
  },
  {
    id: 'notif-009',
    type: NOTIFICATION_TYPES.SYSTEM,
    trigger: NOTIFICATION_TRIGGERS.BOQ_REVISION_REQUESTED,
    userId: 'usr-002',
    title: 'BOQ Revision Requested',
    message:
      'The Invoicing Team has requested revisions on BOQ item "IoT Platform Architecture Design" (boq-011). Feedback: Please update the unit cost breakdown and attach the approved scope document.',
    read: false,
    createdAt: '2024-08-10T14:20:00Z',
  },
  {
    id: 'notif-010',
    type: NOTIFICATION_TYPES.EMAIL,
    trigger: NOTIFICATION_TRIGGERS.SLA_BREACH,
    userId: 'usr-007',
    title: 'SLA Escalation Level 2: Invoice Under Review for 7+ Days',
    message:
      'Invoice INV-2024-006 (SAR 150,000) for Smart City Infrastructure has been under review for 7 days without action. Escalation Level 2 has been triggered. Please review immediately or delegate to a team member.',
    read: false,
    createdAt: '2024-09-22T08:00:00Z',
  },
];

/**
 * Get notifications for a specific user.
 * @param {string} userId
 * @returns {object[]}
 */
export function getNotificationsByUser(userId) {
  return mockNotifications.filter((n) => n.userId === userId);
}

/**
 * Get unread notifications for a specific user.
 * @param {string} userId
 * @returns {object[]}
 */
export function getUnreadNotificationsByUser(userId) {
  return mockNotifications.filter((n) => n.userId === userId && !n.read);
}

/**
 * Count unread notifications for a specific user.
 * @param {string} userId
 * @returns {number}
 */
export function countUnreadNotifications(userId) {
  return getUnreadNotificationsByUser(userId).length;
}
