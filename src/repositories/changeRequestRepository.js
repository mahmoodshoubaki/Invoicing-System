import { createApiClient } from '@/lib/apiClient';
import {
  mapChangeRequest, mapChangeRequestReason, mapChangeRequestRow, mapChangeRequestStatus,
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
  async createChangeRequest(body) {
    const data = await api.post('/CreateChangeRequest', body);
    return { changeRequestId: data?.changeRequestId ?? null, number: data?.number ?? '' };
  },

  /** A returned request, sent again whole — what is left out is dropped. Only its requester may. */
  async updateChangeRequest(body) {
    const data = await api.post('/UpdateChangeRequest', body);
    return { changeRequestId: data?.changeRequestId ?? null, number: data?.number ?? '' };
  },

  async getChangeRequestById(id) {
    return mapChangeRequest(await api.get('/GetChangeRequestById', { ID: id }));
  },

  async getChangeRequestsByBoqId(boqId) {
    const data = await api.get('/GetChangeRequestsByBoqId', { BoqId: boqId });
    return (Array.isArray(data) ? data : []).map(mapChangeRequestRow);
  },

  async getReasons() {
    const data = await api.get('/GetChangeRequestReasons');
    return (Array.isArray(data) ? data : []).map(mapChangeRequestReason);
  },

  async getStatuses() {
    const data = await api.get('/GetChangeRequestStatuses');
    return (Array.isArray(data) ? data : []).map(mapChangeRequestStatus);
  },
};
