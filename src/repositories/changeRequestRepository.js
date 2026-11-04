import { createApiClient } from '@/lib/apiClient';
import {
  createChangeRequestFormData, mapChangeRequest, mapChangeRequestProjectEffect, mapChangeRequestReason, mapChangeRequestRow,
  mapChangeRequestStatus, mapChangeRequestType, mapChangeRequestVersion, updateChangeRequestFormData,
} from '@/models/changeRequest';

const api = createApiClient('/api/BoqChangeRequests');

export const changeRequestRepository = {
  /** @returns {Promise<{ changeRequestId: number, number: string }>} */
  /** @param {Object} body */
  async createChangeRequest(body, files) {
    const data = await api.post('/CreateChangeRequest', createChangeRequestFormData(body, files));
    return { changeRequestId: data?.changeRequestId ?? null, number: data?.number ?? '' };
  },

  /** @param {Object} body */
  async updateChangeRequest(body, files) {
    const data = await api.post('/UpdateChangeRequest', updateChangeRequestFormData(body, files));
    return { changeRequestId: data?.changeRequestId ?? null, number: data?.number ?? '' };
  },

  async downloadAttachment(changeRequestId, contentId, fallbackFileName) {
    return await api.download('/DownloadChangeRequestAttachment', { changeRequestId, contentId }, fallbackFileName);
  },

  async getChangeRequestById(id) {
    return mapChangeRequest(await api.get('/GetChangeRequestById', { ID: id }));
  },

  /**
   * @returns {Promise<{ history: Object[], total: number }>}
   */
  async getChangeRequestHistory(changeRequestId, { skip, take }) {
    const page = await api.get('/GetChangeRequestHistory', { changeRequestId, skip, take });
    return { history: (page?.history ?? []).map(mapChangeRequestVersion), total: page?.total ?? 0 };
  },

  async getChangeRequestsByBoqId(boqId) {
    const data = await api.get('/GetChangeRequestsByBoqId', { BoqId: boqId });
    return (Array.isArray(data) ? data : []).map(mapChangeRequestRow);
  },

  async getReasons() {
    const data = await api.get('/GetChangeRequestReasons');
    return (Array.isArray(data) ? data : []).map(mapChangeRequestReason);
  },

  async getTypes() {
    const data = await api.get('/GetChangeRequestTypes');
    return (Array.isArray(data) ? data : []).map(mapChangeRequestType);
  },

  async getProjectEffects() {
    const data = await api.get('/GetChangeRequestProjectEffects');
    return (Array.isArray(data) ? data : []).map(mapChangeRequestProjectEffect);
  },

  async getStatuses() {
    const data = await api.get('/GetChangeRequestStatuses');
    return (Array.isArray(data) ? data : []).map(mapChangeRequestStatus);
  },
};
