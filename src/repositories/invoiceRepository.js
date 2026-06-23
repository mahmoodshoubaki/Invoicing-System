// REAL INTEGRATION POINT: Replace mock import and all method bodies with real
// API calls to your backend or Azure Functions endpoints.
import { mockInvoices } from '@/mock/invoices';
import { INVOICE_STATUS } from '@/constants/statuses';

/** In-memory mutable store — reset on each server/module reload. */
let invoices = [...mockInvoices];

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

function generateId() {
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const seq = String(invoices.length + 1).padStart(3, '0');
  return `INV-${year}-${seq}`;
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

  /**
   * Create a new draft invoice.
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createInvoice(data) {
    await delay(400);

    const now = new Date().toISOString();
    const newInvoice = {
      ...data,
      id: generateId(),
      invoiceNumber: data.invoiceNumber ?? generateInvoiceNumber(),
      status: INVOICE_STATUS.DRAFT,
      submittedBy: null,
      submittedAt: null,
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    invoices.unshift(newInvoice);
    return { ...newInvoice };
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
};
