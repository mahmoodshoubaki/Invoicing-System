import { createApiClient } from '@/lib/apiClient';
import { createLookupItem, createInvoiceStatus, createBoqItemStatus, createTrackerCycleStatus } from '@/models/lookup';

const boqApi = createApiClient('/api/Boqs');
const invoicesApi = createApiClient('/api/Invoices');

export const lookupsRepository = {
  async getBillingFrequencies() {
    const data = await boqApi.get('/GetBillingFrequencies');
    return (data ?? []).map(createLookupItem);
  },

  async getBoqItemStatuses() {
    const data = await boqApi.get('/GetBoqItemStatuses');
    return (data ?? []).map(createBoqItemStatus);
  },

  async getInvoiceStatuses() {
    const data = await invoicesApi.get('/GetInvoiceStatuses');
    return (data ?? []).map(createInvoiceStatus);
  },

  async getTrackerCycleStatuses() {
    const data = await boqApi.get('/GetTrackerCycleStatuses');
    return (data ?? []).map(createTrackerCycleStatus);
  },

};
