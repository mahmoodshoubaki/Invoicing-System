import { createApiClient } from '@/lib/apiClient';
import {
  createChangeRequestFormData, mapChangeRequest, mapChangeRequestProjectEffect, mapChangeRequestReason, mapChangeRequestRow,
  mapChangeRequestStatus, mapChangeRequestType, mapChangeRequestVersion, updateChangeRequestFormData,
} from '@/models/changeRequest';

const api = createApiClient('/api/BoqChangeRequests');

/**
 * Change requests on a BOQ (2026-10-19). Raising one and editing one that was
 * sent back are the only writes the front end makes — Returned, Rejected,
 * Cancelled and Approved are the workflow's to set.
 *
 * Refusals: BOQ-016 is the request itself, its `errors` keyed `fieldChanges[i]`,
 * `cycleChanges[i]`, `reasonKeys` or `changes`; BOQ-017 a request already open on
 * the BOQ; BOQ-018 the wrong status for the action; BOQ-019 an item locked by an
 * open request; PRJ-002 EPM refused the update.
 */
export const changeRequestRepository = {
  /** @returns {Promise<{ changeRequestId: number, number: string }>} */
  /** @param {Object} body  the request JSON  @param {Array} files  the uploader's entries */
  async createChangeRequest(body, files) {
    const data = await api.post('/CreateChangeRequest', createChangeRequestFormData(body, files));
    return { changeRequestId: data?.changeRequestId ?? null, number: data?.number ?? '' };
  },

  /** A returned request, sent again whole — what is left out is dropped. Only its requester may. */
  /** @param {Object} body  with changeRequestId and attachmentIdsToDelete  @param {Array} files  new files */
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
   * One page of a change request's earlier versions, oldest first. The current version is getChangeRequestById.
   * @returns {Promise<{ history: Object[], total: number }>}  mapChangeRequestVersion's
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
