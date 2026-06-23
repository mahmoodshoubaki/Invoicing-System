// REAL INTEGRATION POINT: Replace mock import and all method bodies with real
// API calls to your backend or Azure Functions endpoints.
import { mockBOQItems } from '@/mock/boq';
import { BOQ_STATUS } from '@/constants/statuses';

/** In-memory mutable store — reset on each server/module reload. */
let boqItems = [...mockBOQItems];

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

function generateId() {
  return `boq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const boqRepository = {
  /**
   * Return all BOQ items for a given project.
   * @param {string} projectId
   * @returns {Promise<object[]>}
   */
  async getBOQByProject(projectId) {
    await delay(300);
    return boqItems.filter((item) => item.projectId === projectId).map((i) => ({ ...i }));
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

  /**
   * Create a new BOQ item.
   * Automatically derives totalCost and vatSAR if not provided.
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createBOQItem(data) {
    await delay(400);

    const quantity = Number(data.quantity) || 0;
    const unitCost = Number(data.unitCost) || 0;
    const totalCost = data.totalCost ?? quantity * unitCost;
    const vatSAR = data.vatSAR ?? totalCost * 0.15;

    const now = new Date().toISOString();
    const newItem = {
      ...data,
      id: generateId(),
      totalCost,
      vatSAR,
      invoicedQuantity: 0,
      status: data.status ?? BOQ_STATUS.DRAFT,
      createdAt: now,
      updatedAt: now,
    };

    boqItems.push(newItem);
    return { ...newItem };
  },

  /**
   * Update a BOQ item by id.
   * Re-derives totalCost/vatSAR if quantity or unitCost changes.
   * @param {string} id
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateBOQItem(id, data) {
    await delay(350);

    const idx = boqItems.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error(`BOQ item not found: ${id}`);

    const merged = { ...boqItems[idx], ...data, id };

    // Recalculate derived fields if inputs changed
    if (data.quantity !== undefined || data.unitCost !== undefined) {
      const quantity = Number(merged.quantity) || 0;
      const unitCost = Number(merged.unitCost) || 0;
      merged.totalCost = quantity * unitCost;
      merged.vatSAR = merged.totalCost * 0.15;
    }

    merged.updatedAt = new Date().toISOString();
    boqItems[idx] = merged;
    return { ...merged };
  },

  /**
   * Delete a BOQ item by id.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteBOQItem(id) {
    await delay(300);

    const idx = boqItems.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error(`BOQ item not found: ${id}`);

    // Cannot delete an invoiced item
    if (boqItems[idx].status === BOQ_STATUS.INVOICED) {
      throw new Error('Cannot delete a BOQ item that has already been invoiced.');
    }

    boqItems.splice(idx, 1);
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
