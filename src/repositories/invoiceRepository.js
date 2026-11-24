import { createApiClient } from '@/lib/apiClient';
import { fetchAllPages } from '@/lib/fetchAllPages';
import { markCollectedBody } from '@/lib/markCollectedForm';
import { createInvoiceableBOQItem } from '@/models/boq';
import {
  createClaimActionBody, createClaimLog, createClaimStage, createFinancialClaimHistory, createInvoiceFinancialClaim,
  createProjectFinancialClaims,
} from '@/models/financialClaim';
import {
  createAddAttachmentsFormData, createInvoice as mapInvoice, createInvoiceFormData, createUpdateInvoiceFormData,
} from '@/models/invoice';

const api = createApiClient('/api/Invoices');

function isNotFound(err) {
  return err.status === 404;
}

export const invoiceRepository = {
  /**
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getInvoiceById(id) {
    const raw = await api.get(`/GetInvoiceById?Id=${encodeURIComponent(id)}`);
    return mapInvoice(raw);
  },

  /**
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createInvoice(data) {
    return await api.post('/CreateInvoice', createInvoiceFormData(data));
  },

  /**
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateInvoice(data) {
    return await api.post('/UpdateInvoice', createUpdateInvoiceFormData(data));
  },

  /**
   * @param {string} invoiceId
   * @param {Array<{file: File, name: string, status: string}>} attachments
   * @returns {Promise<string[]>}
   */
  async addInvoiceAttachments(invoiceId, attachments) {
    const data = await api.post('/AddInvoiceAttachments', createAddAttachmentsFormData(invoiceId, attachments));
    return data?.attachmentIds ?? [];
  },

  /**
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

  /**
   * @param {string} projectCode
   * @returns {Promise<object[]>}
   */
  async getInvoicesByProjectCode(projectCode) {
    try {
      const data = await fetchAllPages(async (skip, take) => {
        const page = await api.get('/GetInvoicesByProjectCode', { ProjectCode: projectCode, skip, take });
        return { rows: page?.invoices ?? [], total: page?.total ?? 0 };
      });
      return data.map(mapInvoice);
    } catch (err) {
      if (isNotFound(err)) return [];
      throw err;
    }
  },

  /**
   * @param {{ statusId?: number|null, skip: number, take: number }} query
   * @returns {Promise<{ invoices: object[], total: number }>}
   */
  async getInvoicesPage({ statusId = null, skip, take }) {
    const params = { skip, take, ...(statusId != null ? { statusId } : {}) };
    const page = await api.get('/GetInvoices', params);
    return { invoices: (page?.invoices ?? []).map(mapInvoice), total: page?.total ?? 0 };
  },

  /**
   * @param {string} invoiceId
   * @param {string} contentId
   * @param {string} fallbackFileName
   * @returns {Promise<{blob: Blob, fileName: string}>}
   */
  async downloadAttachment(invoiceId, contentId, fallbackFileName) {
    return await api.download('/DownloadInvoiceAttachment', {
      ContentId: contentId,
      InvoiceId: invoiceId,
    }, fallbackFileName);
  },

  /**
   * @param {string} invoiceId
   * @returns {Promise<object[]>}
   */
  async getInvoiceHistory(invoiceId) {
    const data = await fetchAllPages(async (skip, take) => {
      const page = await api.get('/GetInvoiceHistory', { InvoiceId: invoiceId, skip, take });
      return { rows: page?.history ?? [], total: page?.total ?? 0 };
    });
    return data.map(mapInvoice);
  },

  /**
   * @param {string} projectCode
   * @returns {Promise<{ contractNumber: number|null, claims: object[] }>}
   */
  async getProjectFinancialClaims(projectCode) {
    const raw = await api.get('/GetProjectFinancialClaims', { projectCode });
    return createProjectFinancialClaims(raw);
  },

  /**
   * @param {string} invoiceId
   * @returns {Promise<{ financialClaimReference: number|null, claim: object|null }>}
   */
  async getInvoiceFinancialClaim(invoiceId) {
    const raw = await api.get('/GetInvoiceFinancialClaim', { invoiceId });
    return createInvoiceFinancialClaim(raw);
  },

  /**
   * @param {number} financialClaimReference
   * @returns {Promise<object[]>}
   */
  async getFinancialClaimHistory(financialClaimReference) {
    const raw = await api.get('/GetFinancialClaimHistory', { financialClaimReference });
    return createFinancialClaimHistory(raw);
  },

  /**
   * @returns {Promise<Array<{ key: number, nameEn: string|null, nameAr: string|null }>>}
   */
  async getNonEtimadClaimStages() {
    const raw = await api.get('/GetNonEtimadFinancialClaimStages');
    return (raw ?? []).map(createClaimStage);
  },

  /**
   * @param {string} invoiceId
   * @returns {Promise<object[]>}
   */
  async getNonEtimadClaimActions(invoiceId) {
    const raw = await api.get('/GetNonEtimadFinancialClaimActions', { invoiceId });
    return createClaimLog(raw);
  },

  /**
   * @param {string} invoiceId
   * @param {{ stageKey: string, actionDate: string, notes: string }} values
   * @returns {Promise<number|null>}
   */
  async addNonEtimadClaimAction(invoiceId, values) {
    const data = await api.post('/AddNonEtimadFinancialClaimAction', { invoiceId, ...createClaimActionBody(values) });
    return data?.claimActionId ?? null;
  },

  /**
   * @param {number} claimActionId
   * @param {{ stageKey: string, actionDate: string, notes: string }} values
   * @returns {Promise<void>}
   */
  async editNonEtimadClaimAction(claimActionId, values) {
    await api.post('/EditNonEtimadFinancialClaimAction', { claimActionId, ...createClaimActionBody(values) });
  },

  /**
   * @param {number} claimActionId
   * @returns {Promise<void>}
   */
  async deleteNonEtimadClaimAction(claimActionId) {
    await api.post('/DeleteNonEtimadFinancialClaimAction', { claimActionId });
  },

  /**
   * @param {string} invoiceId
   * @param {{ collectedAmount: string, collectedDate: string }} values
   * @returns {Promise<void>}
   */
  async markCollected(invoiceId, values) {
    await api.post('/MarkCollected', markCollectedBody(invoiceId, values));
  },

  /**
   * @param {string[]} invoiceIds
   * @returns {Promise<string[]>}
   */
  async deleteInvoices(invoiceIds) {
    const data = await api.post('/DeleteInvoices', { invoiceIds });
    return data?.deletedInvoiceIds ?? [];
  },
};
