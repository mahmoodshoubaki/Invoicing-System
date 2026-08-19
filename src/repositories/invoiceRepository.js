// REAL INTEGRATION POINT: Replace mock import and all method bodies with real
// API calls to your backend or Azure Functions endpoints.
import { mockInvoices } from '@/mock/invoices';
import { INVOICE_STATUS } from '@/constants/statuses';
import { createApiClient } from '@/lib/apiClient';
import { createInvoiceableBOQItem } from '@/models/boq';
import { createInvoice as mapInvoice, createInvoiceFormData, createUpdateInvoiceFormData } from '@/models/invoice';

const api = createApiClient('/api/Invoices');

/** In-memory mutable store — reset on each server/module reload. */
let invoices = [...mockInvoices];

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

/** A project with no invoiceable items yet is a valid empty state, not a failure. */
function isNotFound(err) {
  return err.status === 404;
}

export const invoiceRepository = {
  /**
   * Return invoices, optionally filtered.
   * Supported filters: projectId, status, submittedBy
   *
   * @param {object} filters
   * @returns {Promise<object[]>}
   */
  async getInvoices(filters = {}) {
    await delay(300);

    let result = [...invoices];

    if (filters.projectId) {
      result = result.filter((inv) => inv.projectId === filters.projectId);
    }
    if (filters.status) {
      result = result.filter((inv) => inv.status === filters.status);
    }
    if (filters.submittedBy) {
      result = result.filter((inv) => inv.submittedBy === filters.submittedBy);
    }

    // Sort: newest first
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result;
  },

  /**
   * Find a single invoice by id.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getInvoice(id) {
    await delay(200);
    const invoice = invoices.find((inv) => inv.id === id);
    if (!invoice) throw new Error(`Invoice not found: ${id}`);
    return { ...invoice };
  },

  // REAL API
  /**
   * Return a single invoice by id, including its lines and attachments.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getInvoiceById(id) {
    const raw = await api.get(`/GetInvoiceById?Id=${encodeURIComponent(id)}`);
    return mapInvoice(raw);
  },

  // REAL API
  /**
   * Create and submit a new invoice request.
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createInvoice(data) {
    return await api.post('/CreateInvoice', createInvoiceFormData(data));
  },

  // REAL API
  /**
   * Update an invoice's reason/expected invoicing date and attachments.
   * Every other invoice field is read-only once created.
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateInvoice(data) {
    return await api.post('/UpdateInvoice', createUpdateInvoiceFormData(data));
  },

  /**
   * Transition a draft/rejected invoice to Submitted status.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async submitInvoice(id) {
    await delay(350);

    const idx = invoices.findIndex((inv) => inv.id === id);
    if (idx === -1) throw new Error(`Invoice not found: ${id}`);

    const invoice = invoices[idx];
    const allowedStatuses = [INVOICE_STATUS.DRAFT, INVOICE_STATUS.REJECTED];
    if (!allowedStatuses.includes(invoice.status)) {
      throw new Error(
        `Cannot submit invoice with status "${invoice.status}". Only Draft or Rejected invoices can be submitted.`
      );
    }

    invoices[idx] = {
      ...invoice,
      status: INVOICE_STATUS.SUBMITTED,
      submittedAt: new Date().toISOString(),
      rejectedBy: null,
      rejectedAt: null,
      updatedAt: new Date().toISOString(),
    };

    return { ...invoices[idx] };
  },

  /**
   * Approve an invoice (Submitted → Approved).
   * @param {string} id
   * @param {string} userId  The approving user's id.
   * @returns {Promise<object>}
   */
  async approveInvoice(id, userId) {
    await delay(350);

    const idx = invoices.findIndex((inv) => inv.id === id);
    if (idx === -1) throw new Error(`Invoice not found: ${id}`);

    const invoice = invoices[idx];
    const approvableStatuses = [INVOICE_STATUS.SUBMITTED, INVOICE_STATUS.UNDER_REVIEW];
    if (!approvableStatuses.includes(invoice.status)) {
      throw new Error(
        `Cannot approve invoice with status "${invoice.status}".`
      );
    }

    invoices[idx] = {
      ...invoice,
      status: INVOICE_STATUS.APPROVED,
      approvedBy: userId,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { ...invoices[idx] };
  },

  /**
   * Reject an invoice (Submitted | Under Review → Rejected).
   * @param {string} id
   * @param {string} userId
   * @param {string} reason
   * @returns {Promise<object>}
   */
  async rejectInvoice(id, userId, reason) {
    await delay(350);

    if (!reason || !reason.trim()) {
      throw new Error('A rejection reason is required.');
    }

    const idx = invoices.findIndex((inv) => inv.id === id);
    if (idx === -1) throw new Error(`Invoice not found: ${id}`);

    const invoice = invoices[idx];
    const rejectableStatuses = [INVOICE_STATUS.SUBMITTED, INVOICE_STATUS.UNDER_REVIEW];
    if (!rejectableStatuses.includes(invoice.status)) {
      throw new Error(
        `Cannot reject invoice with status "${invoice.status}".`
      );
    }

    invoices[idx] = {
      ...invoice,
      status: INVOICE_STATUS.REJECTED,
      rejectedBy: userId,
      rejectedAt: new Date().toISOString(),
      comments: reason,
      updatedAt: new Date().toISOString(),
    };

    return { ...invoices[idx] };
  },

  /**
   * Return all invoices for a given project.
   * @param {string} projectId
   * @returns {Promise<object[]>}
   */
  async getInvoicesByProject(projectId) {
    return invoiceRepository.getInvoices({ projectId });
  },

  // REAL API
  /**
   * Return BOQ items currently eligible to be invoiced for a project, with
   * committed/available quantity already resolved server-side.
   * @param {string} projectCode
   * @returns {Promise<object[]>}
   */
  async getInvoiceableBOQItems(projectCode) {
    try {
      const data = await api.get(`/GetInvoiceableBoqItemsByProjectCode?projectCode=${encodeURIComponent(projectCode)}`);
      return (data ?? []).map(createInvoiceableBOQItem);
    } catch (err) {
      if (isNotFound(err)) return [];
      throw err;
    }
  },

  // REAL API
  /**
   * Return all invoices submitted for a project.
   * @param {string} projectCode
   * @returns {Promise<object[]>}
   */
  async getInvoicesByProjectCode(projectCode) {
    try {
      const data = await api.get(`/GetInvoicesByProjectCode?ProjectCode=${encodeURIComponent(projectCode)}`);
      return (data ?? []).map(mapInvoice);
    } catch (err) {
      if (isNotFound(err)) return [];
      throw err;
    }
  },

  // REAL API
  /**
   * Download a single invoice attachment.
   * @param {string} invoiceId
   * @param {string} contentId - the attachment's contentId, not its record id.
   * @param {string} fallbackFileName - used if the response has no filename header.
   * @returns {Promise<{blob: Blob, fileName: string}>}
   */
  async downloadAttachment(invoiceId, contentId, fallbackFileName) {
    return await api.download('/DownloadInvoiceAttachment', {
      ContentId: contentId,
      InvoiceId: invoiceId,
    }, fallbackFileName);
  },

  // REAL API
  /**
   * Return the revision history for an invoice — each entry is a full
   * snapshot with the same shape as getInvoiceById's response.
   * @param {string} invoiceId
   * @returns {Promise<object[]>}
   */
  async getInvoiceHistory(invoiceId) {
    const data = await api.get(`/GetInvoiceHistory?InvoiceId=${encodeURIComponent(invoiceId)}`);
    return (data ?? []).map(mapInvoice);
  },
};
