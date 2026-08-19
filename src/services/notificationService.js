// REAL INTEGRATION POINT: Replace method bodies with real email/push calls.
// Suggested integrations:
//   - Email: SendGrid / Azure Communication Services
//   - Push notifications: Azure Notification Hubs
//   - In-app: Store via notificationRepository and surface via WebSocket or polling

import { notificationRepository } from '@/repositories/notificationRepository';
import { NOTIFICATION_TRIGGERS, NOTIFICATION_TYPES } from '@/mock/notifications';
import { formatCurrency, formatDate } from '@/utils/formatters';

/**
 * notificationService — orchestrates in-app notification records and stubs for
 * external delivery channels (email, push).
 */
export const notificationService = {
  /**
   * Notify relevant users that a BOQ item is due in 7 days (T-7 warning).
   * REAL INTEGRATION POINT: Send an email via your email provider.
   *
   * @param {object} project
   * @param {object} boqItem
   * @returns {Promise<object>}
   */
  async sendT7Warning(project, boqItem) {
    const displayName = boqItem.englishItem || boqItem.arabicItem || 'BOQ Item';
    const notification = {
      type: NOTIFICATION_TYPES.SYSTEM,
      trigger: NOTIFICATION_TRIGGERS.SLA_WARNING,
      userId: project.projectManager,
      title: 'SLA Warning: BOQ Item Due in 7 Days',
      message:
        `BOQ item "${displayName}" for project "${project.projectName || project.clientName}" ` +
        `is due for invoicing in 7 days on ${formatDate(boqItem.expectedInvoicingDate)}. ` +
        `Please prepare the invoice request.`,
    };

    // REAL INTEGRATION POINT: Also send email here
    // await emailClient.send({ to: project.managerEmail, subject: notification.title, body: notification.message });

    return notificationRepository.createNotification(notification);
  },

  /**
   * Notify on the BOQ item due date (T-0 reminder).
   * REAL INTEGRATION POINT: Send an email and/or push notification.
   *
   * @param {object} project
   * @param {object} boqItem
   * @returns {Promise<object>}
   */
  async sendT0Reminder(project, boqItem) {
    const displayName = boqItem.englishItem || boqItem.arabicItem || 'BOQ Item';
    const notification = {
      type: NOTIFICATION_TYPES.SYSTEM,
      trigger: NOTIFICATION_TRIGGERS.SLA_WARNING,
      userId: project.projectManager,
      title: 'Reminder: BOQ Item Due Today',
      message:
        `BOQ item "${displayName}" for project "${project.projectName || project.clientName}" ` +
        `is due for invoicing today (${formatDate(boqItem.expectedInvoicingDate)}). ` +
        `Please submit the invoice request immediately.`,
    };

    return notificationRepository.createNotification(notification);
  },

  /**
   * Notify the invoicing team that an invoice has been submitted for review.
   * REAL INTEGRATION POINT: Send email to all invoicing team members.
   *
   * @param {object} invoice
   * @param {string[]} recipientUserIds  User IDs to notify.
   * @returns {Promise<object[]>}
   */
  async sendInvoiceSubmitted(invoice, recipientUserIds = []) {
    const notifications = recipientUserIds.map((userId) => ({
      type: NOTIFICATION_TYPES.SYSTEM,
      trigger: NOTIFICATION_TRIGGERS.INVOICE_SUBMITTED,
      userId,
      title: 'Invoice Submitted for Review',
      message:
        `Invoice ${invoice.invoiceNumber} (${formatCurrency(invoice.invoiceAmount, 'SAR')}) ` +
        `has been submitted and is awaiting your review.`,
    }));

    return Promise.all(
      notifications.map((n) => notificationRepository.createNotification(n))
    );
  },

  /**
   * Notify the submitter that their invoice has been approved.
   * REAL INTEGRATION POINT: Send email confirmation.
   *
   * @param {object} invoice
   * @param {string} recipientUserId
   * @returns {Promise<object>}
   */
  async sendInvoiceApproved(invoice, recipientUserId) {
    return notificationRepository.createNotification({
      type: NOTIFICATION_TYPES.SYSTEM,
      trigger: NOTIFICATION_TRIGGERS.INVOICE_APPROVED,
      userId: recipientUserId,
      title: 'Invoice Approved',
      message:
        `Invoice ${invoice.invoiceNumber} (${formatCurrency(invoice.invoiceAmount, 'SAR')}) ` +
        `has been approved and is ready for client submission.`,
    });
  },

  /**
   * Notify the submitter that their invoice has been rejected.
   * REAL INTEGRATION POINT: Send email with rejection reason.
   *
   * @param {object} invoice
   * @param {string} recipientUserId
   * @param {string} reason
   * @returns {Promise<object>}
   */
  async sendInvoiceRejected(invoice, recipientUserId, reason) {
    return notificationRepository.createNotification({
      type: NOTIFICATION_TYPES.SYSTEM,
      trigger: NOTIFICATION_TRIGGERS.INVOICE_REJECTED,
      userId: recipientUserId,
      title: 'Invoice Rejected — Action Required',
      message:
        `Invoice ${invoice.invoiceNumber} has been rejected. ` +
        `Reason: ${reason}. Please revise and resubmit.`,
    });
  },

  /**
   * Send an SLA escalation notification.
   * Escalation level determines severity and intended audience.
   * REAL INTEGRATION POINT: Level 3 should also email BU Head and management.
   *
   * @param {object} violation  SLA violation object from slaService.
   * @param {number} level      Escalation level: 1, 2, or 3.
   * @param {string[]} recipientUserIds
   * @returns {Promise<object[]>}
   */
  async sendSLAEscalation(violation, level, recipientUserIds = []) {
    const { boqItem, daysOverdue } = violation;
    const displayName = boqItem.englishItem || boqItem.arabicItem || 'BOQ Item';

    const levelLabels = {
      1: 'Initial Escalation',
      2: 'Secondary Escalation',
      3: 'Final Escalation — Urgent',
    };

    const notifications = recipientUserIds.map((userId) => ({
      type: NOTIFICATION_TYPES.EMAIL,
      trigger: NOTIFICATION_TRIGGERS.SLA_BREACH,
      userId,
      title: `SLA Breach: ${levelLabels[level] || 'Escalation'} — BOQ Item Overdue`,
      message:
        `BOQ item "${displayName}" is ${daysOverdue} day(s) overdue for invoicing. ` +
        `Escalation Level ${level} has been triggered. ` +
        `Please take immediate action to resolve this.`,
    }));

    return Promise.all(
      notifications.map((n) => notificationRepository.createNotification(n))
    );
  },

  /**
   * Notify the next assignee that a workflow step has been assigned to them.
   * @param {object} step         Workflow step object.
   * @param {object} invoice      The invoice or entity being processed.
   * @param {string} recipientUserId
   * @returns {Promise<object>}
   */
  async sendWorkflowStepAssigned(step, invoice, recipientUserId) {
    return notificationRepository.createNotification({
      type: NOTIFICATION_TYPES.SYSTEM,
      trigger: NOTIFICATION_TRIGGERS.WORKFLOW_STEP_ASSIGNED,
      userId: recipientUserId,
      title: `Action Required: ${step.name}`,
      message:
        `Invoice ${invoice.invoiceNumber} (${formatCurrency(invoice.invoiceAmount, 'SAR')}) ` +
        `requires your action as part of the "${step.name}" step. SLA: ${step.slaHours ?? 48} hours.`,
    });
  },

  /**
   * Return all notifications for a given user.
   * @param {string} userId
   * @returns {Promise<object[]>}
   */
  async getNotificationsForUser(userId) {
    return notificationRepository.getNotifications(userId);
  },

  /**
   * Mark a single notification as read.
   * @param {string} notificationId
   * @returns {Promise<object>}
   */
  async markAsRead(notificationId) {
    return notificationRepository.markAsRead(notificationId);
  },

  /**
   * Mark all notifications for a user as read.
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async markAllAsRead(userId) {
    return notificationRepository.markAllAsRead(userId);
  },
};
