import { boqRepository } from '@/repositories/boqRepository';
import { BOQ_STATUS } from '@/constants/statuses';
import { VAT_RATE } from '@/constants/sla';

export const boqService = {
  /**
   * @param {string} projectId
   * @returns {Promise<object[]>}
   */
  async getBOQByProject(projectId) {
    if (!projectId) throw new Error('projectId is required.');
    return boqRepository.getBOQByProject(projectId);
  },

  /**
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getBOQItem(id) {
    const item = await boqRepository.getBOQItem(id);
    return boqService._enrichBOQItem(item);
  },

  /**
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createBOQItem(data) {
    boqService._validateBOQData(data);

    const quantity = Number(data.quantity);
    const unitCost = Number(data.unitCost);
    const totalCost = quantity * unitCost;
    const vatSAR = Math.round(totalCost * VAT_RATE * 100) / 100;

    const payload = {
      ...data,
      quantity,
      unitCost,
      totalCost,
      vatSAR,
      invoicedQuantity: 0,
      status: BOQ_STATUS.DRAFT,
    };

    const created = await boqRepository.createBOQItem(payload);
    return boqService._enrichBOQItem(created);
  },

  /**
   * @param {string} id
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateBOQItem(id, data) {
    const existing = await boqRepository.getBOQItem(id);

    if (existing.status === BOQ_STATUS.INVOICED) {
      throw new Error('Cannot edit a BOQ item that has already been invoiced.');
    }

    // Re-compute derived fields if cost inputs are changing
    const payload = { ...data };
    if (data.quantity !== undefined || data.unitCost !== undefined) {
      const quantity = Number(data.quantity ?? existing.quantity);
      const unitCost = Number(data.unitCost ?? existing.unitCost);
      payload.totalCost = quantity * unitCost;
      payload.vatSAR = Math.round(payload.totalCost * VAT_RATE * 100) / 100;
    }

    const updated = await boqRepository.updateBOQItem(id, payload);
    return boqService._enrichBOQItem(updated);
  },

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteBOQItem(id) {
    return boqRepository.deleteBOQItem(id);
  },

  /**
   * @param {string} id
   * @returns {Promise<object>}
   */
  async submitBOQForApproval(id) {
    const item = await boqRepository.getBOQItem(id);

    if (item.status !== BOQ_STATUS.DRAFT) {
      throw new Error(
        `Only Draft BOQ items can be submitted for approval. Current status: "${item.status}".`
      );
    }

    const errors = boqService._validateBOQForApproval(item);
    if (errors.length > 0) {
      throw new Error(
        `BOQ item is not ready for approval: ${errors.join('; ')}.`
      );
    }

    const updated = await boqRepository.updateBOQItem(id, {
      status: BOQ_STATUS.PENDING_VERIFICATION,
    });
    return boqService._enrichBOQItem(updated);
  },

  /**
   * @param {string} id
   * @returns {Promise<object>}
   */
  async approveBOQItem(id) {
    const item = await boqRepository.getBOQItem(id);

    if (item.status !== BOQ_STATUS.PENDING_VERIFICATION) {
      throw new Error(
        `Only BOQ items in "Pending Verification" status can be approved. Current status: "${item.status}".`
      );
    }

    const updated = await boqRepository.approveBOQItem(id);
    return boqService._enrichBOQItem(updated);
  },

  /**
   * @param {string} projectId
   * @param {object[]} items
   * @returns {Promise<object[]>}
   */
  async bulkCreateBOQ(projectId, items) {
    if (!projectId) throw new Error('projectId is required for bulk creation.');
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('At least one BOQ item is required for bulk creation.');
    }

    // Validate each item
    items.forEach((item, idx) => {
      try {
        boqService._validateBOQData(item);
      } catch (err) {
        throw new Error(`BOQ item at index ${idx}: ${err.message}`);
      }
    });

    return boqRepository.bulkCreateBOQ(projectId, items);
  },

  /**
   * @param {object} data
   */
  _validateBOQData(data) {
    if (!data.projectId) throw new Error('projectId is required.');
    if (!data.englishItem?.trim() && !data.arabicItem?.trim()) {
      throw new Error('At least one of englishItem or arabicItem is required.');
    }
    if (!data.quantity || Number(data.quantity) <= 0) {
      throw new Error('Quantity must be a positive number.');
    }
    if (data.unitCost === undefined || Number(data.unitCost) < 0) {
      throw new Error('Unit cost must be zero or a positive number.');
    }
    if (!data.expectedInvoicingDate) {
      throw new Error('Expected invoicing date is required.');
    }
  },

  /**
   * @param {object} item
   * @returns {string[]}
   */
  _validateBOQForApproval(item) {
    const errors = [];

    if (!item.englishItem?.trim() && !item.arabicItem?.trim()) {
      errors.push('Item description is missing');
    }
    if (!item.quantity || Number(item.quantity) <= 0) {
      errors.push('Quantity must be greater than zero');
    }
    if (item.unitCost === undefined || Number(item.unitCost) < 0) {
      errors.push('Unit cost is invalid');
    }
    if (!item.totalCost || Number(item.totalCost) <= 0) {
      errors.push('Total cost must be greater than zero');
    }
    if (!item.expectedInvoicingDate) {
      errors.push('Expected invoicing date is missing');
    }
    if (!item.billingFrequency) {
      errors.push('Billing frequency is missing');
    }

    return errors;
  },

  /**
   * @param {object} item
   * @returns {object}
   */
  _enrichBOQItem(item) {
    if (!item) return item;

    const totalWithVat =
      (Number(item.totalCost) || 0) + (Number(item.vatSAR) || 0);

    const remainingQuantity =
      (Number(item.quantity) || 0) - (Number(item.invoicedQuantity) || 0);

    const completionPercent =
      item.quantity > 0
        ? Math.round((item.invoicedQuantity / item.quantity) * 100)
        : 0;

    return {
      ...item,
      totalWithVat,
      remainingQuantity,
      completionPercent,
      displayName: item.englishItem || item.arabicItem || 'Unnamed BOQ Item',
    };
  },
};
