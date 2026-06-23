import { invoiceRepository } from '@/repositories/invoiceRepository';
import { INVOICE_STATUS } from '@/constants/statuses';
import { PERMISSIONS } from '@/constants/permissions';
import { hasPermission } from '@/services/permissionService';

/**
 * invoiceService — business logic layer on top of invoiceRepository.
 *
 * Key responsibilities:
 *   - Field validation before persistence
 *   - Status transition enforcement
 *   - RBAC checks for approve/reject operations
 *   - Enriched/computed display fields
 */
export const invoiceService = {
  /**
   * Return invoices with optional filters and enriched fields.
   * @param {object} filters
   * @returns {Promise<object[]>}
   */
  async getInvoices(filters = {}) {
    const invoices = await invoiceRepository.getInvoices(filters);
    return invoices.map(invoiceService._enrichInvoice);
  },

  /**
   * Return a single invoice by id.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getInvoice(id) {
    const invoice = await invoiceRepository.getInvoice(id);
    return invoiceService._enrichInvoice(invoice);
  },

  /**
   * Create a new draft invoice after validating required fields.
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createInvoice(data) {
    invoiceService._validateInvoiceData(data);
    const created = await invoiceRepository.createInvoice(data);
    return invoiceService._enrichInvoice(created);
  },

  /**
   * Submit a draft invoice for approval.
   * Validates required fields and enforces the Draft → Submitted transition.
   *
   * @param {string} id
   * @param {string[]} userRoles  Roles of the submitting user for RBAC check.
   * @returns {Promise<object>}
   */
  async submitInvoice(id, userRoles = []) {
    if (!hasPermission(userRoles, PERMISSIONS.INVOICE_SUBMIT)) {
      throw new Error('You do not have permission to submit invoices.');
    }

    const invoice = await invoiceRepository.getInvoice(id);

    if (invoice.status !== INVOICE_STATUS.DRAFT) {
      throw new Error(
        `Only Draft invoices can be submitted. Current status: "${invoice.status}".`
      );
    }

    if (!invoice.boqItemId) {
      throw new Error('Invoice must be linked to a BOQ item before it can be submitted.');
    }

    if (!invoice.reason?.trim()) {
      throw new Error('Invoice submission reason / delivery description is required.');
    }

    const submitted = await invoiceRepository.submitInvoice(id);
    return invoiceService._enrichInvoice(submitted);
  },

  /**
   * Approve an invoice.
   * Enforces RBAC: requires INVOICE_APPROVE permission.
   *
   * @param {string} id
   * @param {string} userId        ID of the approving user.
   * @param {string[]} userRoles   Roles of the approving user.
   * @returns {Promise<object>}
   */
  async approveInvoice(id, userId, userRoles = []) {
    if (!hasPermission(userRoles, PERMISSIONS.INVOICE_APPROVE)) {
      throw new Error('You do not have permission to approve invoices.');
    }

    if (!userId) throw new Error('userId is required to approve an invoice.');

    const invoice = await invoiceRepository.getInvoice(id);
    const approvableStatuses = [INVOICE_STATUS.SUBMITTED, INVOICE_STATUS.UNDER_REVIEW];

    if (!approvableStatuses.includes(invoice.status)) {
      throw new Error(
        `Cannot approve an invoice with status "${invoice.status}". ` +
          `Invoice must be Submitted or Under Review.`
      );
    }

    const approved = await invoiceRepository.approveInvoice(id, userId);
    return invoiceService._enrichInvoice(approved);
  },

  /**
   * Reject an invoice with a mandatory reason.
   * Enforces RBAC: requires INVOICE_REJECT permission.
   *
   * @param {string} id
   * @param {string} userId        ID of the rejecting user.
   * @param {string} reason        Reason for rejection (required).
   * @param {string[]} userRoles   Roles of the rejecting user.
   * @returns {Promise<object>}
   */
  async rejectInvoice(id, userId, reason, userRoles = []) {
    if (!hasPermission(userRoles, PERMISSIONS.INVOICE_REJECT)) {
      throw new Error('You do not have permission to reject invoices.');
    }

    if (!userId) throw new Error('userId is required to reject an invoice.');
    if (!reason?.trim()) throw new Error('A rejection reason is required.');

    const invoice = await invoiceRepository.getInvoice(id);
    const rejectableStatuses = [INVOICE_STATUS.SUBMITTED, INVOICE_STATUS.UNDER_REVIEW];

    if (!rejectableStatuses.includes(invoice.status)) {
      throw new Error(
        `Cannot reject an invoice with status "${invoice.status}". ` +
          `Invoice must be Submitted or Under Review.`
      );
    }

    const rejected = await invoiceRepository.rejectInvoice(id, userId, reason);
    return invoiceService._enrichInvoice(rejected);
  },

  /**
   * Return all invoices linked to a project.
   * @param {string} projectId
   * @returns {Promise<object[]>}
   */
  async getInvoicesByProject(projectId) {
    const invoices = await invoiceRepository.getInvoicesByProject(projectId);
    return invoices.map(invoiceService._enrichInvoice);
  },

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Validate required invoice fields.
   * @param {object} data
   */
  _validateInvoiceData(data) {
    if (!data.projectId) throw new Error('projectId is required.');
    if (!data.boqItemId) throw new Error('boqItemId is required to link the invoice to a BOQ item.');
    if (!data.invoiceAmount || Number(data.invoiceAmount) <= 0) {
      throw new Error('Invoice amount must be greater than zero.');
    }
    if (!data.expectedDate) throw new Error('Expected payment date is required.');
  },

  /**
   * Add computed/display fields to an invoice object.
   * @param {object} invoice
   * @returns {object}
   */
  _enrichInvoice(invoice) {
    if (!invoice) return invoice;

    const totalWithVat =
      (Number(invoice.invoiceAmount) || 0) * 1.15;

    const vatAmount =
      Math.round((Number(invoice.invoiceAmount) || 0) * 0.15 * 100) / 100;

    const isPending =
      invoice.status === INVOICE_STATUS.SUBMITTED ||
      invoice.status === INVOICE_STATUS.UNDER_REVIEW;

    const isActionable = isPending;

    const daysSinceSubmission = invoice.submittedAt
      ? Math.floor(
          (Date.now() - new Date(invoice.submittedAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    return {
      ...invoice,
      vatAmount,
      totalWithVat: Math.round(totalWithVat * 100) / 100,
      isPending,
      isActionable,
      daysSinceSubmission,
    };
  },
};
