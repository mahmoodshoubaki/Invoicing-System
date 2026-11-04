import { BOQ_STATUS } from '@/constants/statuses';
import { VAT_RATE } from '@/constants/appConfig';
import { createApiClient } from '@/lib/apiClient';
import { fetchAllPages } from '@/lib/fetchAllPages';
import {
  createBOQ, createBOQItem, createBOQItemHistoryEntry, createTrackerCycle,
  createBOQItemPayload, updateBOQItemPayload, createBoqAttachmentsFormData,
} from '@/models/boq';

const api = createApiClient('/api/Boqs');

let boqItems = [];

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

function generateId() {
  return `boq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function isNotFound(err) {
  return err.status === 404;
}

export const boqRepository = {
  async getBOQByProjectCode(projectCode) {
    try {
      let first = null;
      const items = await fetchAllPages(async (skip, take) => {
        const page = await api.get('/GetBoqByProjectCode', { projectCode, skip, take });
        first ??= page;
        return { rows: page?.boqItems ?? [], total: page?.total ?? 0 };
      });
      return first ? createBOQ({ ...first, boqItems: items }) : { projectCode, id: null, boqItems: [] };
    } catch (err) {
      if (isNotFound(err)) return { projectCode, id: null, boqItems: [] };
      throw err;
    }
  },

  async getBOQById(boqId) {
    try {
      const data = await api.get(`/GetBoqById?ID=${encodeURIComponent(boqId)}`);
      return data ? createBOQ(data) : null;
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  },

  /**
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getBOQItem(id) {
    await delay(200);
    const item = boqItems.find((i) => i.id === id);
    if (!item) throw new Error(`BOQ item not found: ${id}`);
    return { ...item };
  },

  async createBOQItem(form, boq, cycles = []) {
    const response = await api.post('/InsertBoqItem', createBOQItemPayload(form, boq, cycles));
    return createBOQItem(response);
  },

  /**
   * @param {number} id
   * @param {object} data
   * @returns {Promise<{ isUpdated: boolean }>}
   */
  async updateBOQItem(id, data, cycles = []) {
    return await api.post('/UpdateBoqItem', updateBOQItemPayload(id, data, cycles));
  },

  /**
   * @param {string} id
   * @param {string} boqId
   * @returns {Promise<void>}
   */
  async deleteBOQItem(id, boqId) {
    const body = {
      ItemId: id,
      BoqId: boqId ?? null,
    };
    await api.post('/DeleteBoqItem', body);
  },
  /**
   * @param {number[]} ids
   * @param {string} boqId
   * @returns {Promise<void>}
   */
  async bulkDeleteBOQItems(ids, boqId) {
    const body = {
      ItemsId: ids,
      BoqId: boqId ?? null,
    };
    await api.post('/BulkDeleteBoqItems', body);
  },

  /**
   * @param {number} boqItemId
   * @returns {Promise<object[]>}
   */
  async getBOQItemHistory(boqItemId) {
    try {
      const data = await fetchAllPages(async (skip, take) => {
        const page = await api.get('/GetBoqItemHistory', { ItemId: boqItemId, skip, take });
        return { rows: page?.history ?? [], total: page?.total ?? 0 };
      });
      return data.map(createBOQItemHistoryEntry);
    } catch (err) {
      if (isNotFound(err)) return [];
      throw err;
    }
  },

  /**
   * @param {object} params
   * @param {string} params.anchorDate
   * @param {number|string} params.billingFrequencyId
   * @param {string} params.contractStartDate
   * @param {string} params.contractFinishDate
   * @param {string} [params.boqItemId]
   * @returns {Promise<object[]>}
   */
  /** @returns {Promise<string[]>} */
  async addBoqAttachments(boqId, files) {
    const data = await api.post('/AddBoqAttachments', createBoqAttachmentsFormData(boqId, files));
    return data?.attachmentIds ?? [];
  },

  async deleteBoqAttachment(boqId, attachmentId) {
    const data = await api.post('/DeleteBoqAttachment', { boqId, attachmentId });
    return data?.succeeded === true || data?.success === true;
  },

  async downloadBoqAttachment(boqId, contentId, fallbackFileName) {
    return await api.download('/DownloadBoqAttachment', { boqId, contentId }, fallbackFileName);
  },

  async previewInvoicingPlan({ anchorDate, billingFrequencyId, contractStartDate, contractFinishDate, boqItemId }) {
    const query = {
      AnchorDate:          anchorDate,
      BillingFrequencyId:  billingFrequencyId,
      ContractStartDate:   contractStartDate,
      ContractFinishDate:  contractFinishDate,
    };
    if (boqItemId) query.BoqItemId = boqItemId;
    const data = await api.get('/GetTrackerCyclesPreview', query);
    return (data ?? []).map(createTrackerCycle);
  },

  /**
   * @param {string} boqItemId
   * @returns {Promise<object[]>}
   */
  async getTrackerCycles(boqItemId) {
    const data = await api.get('/GetTrackerCycles', { BoqItemId: boqItemId });
    return (data ?? []).map(createTrackerCycle);
  },

  /**
   * @param {string} id
   * @returns {Promise<object>}
   */
  async approveBOQItem(id) {
    await delay(350);

    const idx = boqItems.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error(`BOQ item not found: ${id}`);

    const item = boqItems[idx];
    if (item.status === BOQ_STATUS.INVOICED) {
      throw new Error('Cannot approve a BOQ item that is already invoiced.');
    }

    boqItems[idx] = {
      ...item,
      status: BOQ_STATUS.APPROVED,
      updatedAt: new Date().toISOString(),
    };

    return { ...boqItems[idx] };
  },

  /**
   * @param {string} projectId
   * @param {object[]} items
   * @returns {Promise<object[]>}
   */
  async bulkCreateBOQ(projectId, items) {
    await delay(600);

    const now = new Date().toISOString();
    const created = items.map((data) => {
      const quantity = Number(data.quantity) || 0;
      const unitCost = Number(data.unitCost) || 0;
      const totalCost = data.totalCost ?? quantity * unitCost;
      const vatSAR = data.vatSAR ?? totalCost * VAT_RATE;

      const newItem = {
        ...data,
        id: generateId(),
        projectId,
        totalCost,
        vatSAR,
        invoicedQuantity: 0,
        status: BOQ_STATUS.DRAFT,
        createdAt: now,
        updatedAt: now,
      };

      boqItems.push(newItem);
      return { ...newItem };
    });

    return created;
  },

  /**
   * @returns {Promise<object[]>}
   */
  async getAllBOQ() {
    await delay(300);
    return boqItems.map((i) => ({ ...i }));
  },
};
