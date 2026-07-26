import { BOQ_STATUS } from '@/constants/statuses';
import { createApiClient } from '@/lib/apiClient';
import { createBOQ, createBOQItem, createBOQItemHistoryEntry } from '@/models/boq';

const api = createApiClient('/api/Boqs');

/** In-memory mutable store for write operations without real endpoints yet. */
let boqItems = [];

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

function generateId() {
  return `boq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** A project/BOQ with no items yet is a valid empty state, not a failure. */
function isNotFound(err) {
  return err.status === 404;
}

export const boqRepository = {
  // REAL API
  async getBOQByProjectCode(projectCode) {
    try {
      const data = await api.get(`/GetBoqByProjectCode?projectCode=${encodeURIComponent(projectCode)}`);
      return data ? createBOQ(data) : { projectCode, id: null, boqItems: [] };
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
   * Return a single BOQ item by id.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getBOQItem(id) {
    await delay(200);
    const item = boqItems.find((i) => i.id === id);
    if (!item) throw new Error(`BOQ item not found: ${id}`);
    return { ...item };
  },

  async createBOQItem(form, boq) {
    const body = {
      BoqId:                 boq?.id          ?? '00000000-0000-0000-0000-000000000000',
      ProjectCode:           boq?.projectCode ?? null,
      EnglishName:           form.englishName,
      ArabicName:            form.arabicName,
      Quantity:              Number(form.quantity),
      UnitCost:              Number(form.unitCost),
      ExpectedInvoicingDate: form.expectedInvoicingDate || null,
      BaselineInvoicingDate: form.baselineInvoicingDate || null,
      BillingFrequencyId:    Number(form.billingFrequencyId),
      Notes:                 form.notes                || null,
      StatusId:              1,
    };
    const response = await api.post('/InsertBoqItem', body);
    return createBOQItem(response);
  },

  // REAL API
  /**
   * Update a BOQ item by id. Response is just { isUpdated: boolean } — the
   * caller refetches the BOQ list to see the change, no item is returned here.
   * @param {number} id
   * @param {object} data
   * @returns {Promise<{ isUpdated: boolean }>}
   */
  async updateBOQItem(id, data) {
    const body = {
      ID:                    id,
      BoqId:                 data.boqId ?? null,
      EnglishName:           data.englishName,
      ArabicName:            data.arabicName,
      Quantity:              Number(data.quantity),
      UnitCost:              Number(data.unitCost),
      ExpectedInvoicingDate: data.expectedInvoicingDate || null,
      baselineInvoicingDate: data.baselineInvoicingDate || null,
      BillingFrequencyId:    Number(data.billingFrequencyId),
      Notes:                 data.notes || null,
      StatusId:              data.statusId,
    };
    return await api.post('/UpdateBoqItem', body);
  },

  // REAL API
  /**
   * Delete a BOQ item by id.
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
  // REAL API
  /**
   * Bulk delete BOQ items by id.
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

  // REAL API
  /**
   * Return the revision history for a BOQ item.
   * @param {number} boqItemId
   * @returns {Promise<object[]>}
   */
  async getBOQItemHistory(boqItemId) {
    try {
      const data = await api.get(`/GetBoqItemHistory?ItemId=${encodeURIComponent(boqItemId)}`);
      return (data ?? []).map(createBOQItemHistoryEntry);
    } catch (err) {
      if (isNotFound(err)) return [];
      throw err;
    }
  },

  /**
   * Approve a BOQ item (transition from Pending Verification → Approved).
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
   * Bulk-create BOQ items for a project.
   * @param {string} projectId
   * @param {object[]} items  Array of BOQ item data objects.
   * @returns {Promise<object[]>}
   */
  async bulkCreateBOQ(projectId, items) {
    await delay(600);

    const now = new Date().toISOString();
    const created = items.map((data) => {
      const quantity = Number(data.quantity) || 0;
      const unitCost = Number(data.unitCost) || 0;
      const totalCost = data.totalCost ?? quantity * unitCost;
      const vatSAR = data.vatSAR ?? totalCost * 0.15;

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
   * Return all BOQ items regardless of project (admin/stats use).
   * @returns {Promise<object[]>}
   */
  async getAllBOQ() {
    await delay(300);
    return boqItems.map((i) => ({ ...i }));
  },
};
