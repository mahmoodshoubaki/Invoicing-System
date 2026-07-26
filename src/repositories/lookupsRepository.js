import { createApiClient } from '@/lib/apiClient';
import { createLookupItem, createInvoiceStatus, createBoqItemStatus } from '@/models/lookup';

const boqApi = createApiClient('/api/Boqs');
const invoicesApi = createApiClient('/api/Invoices');

export const lookupsRepository = {
  // REAL API
  async getBillingFrequencies() {
    const data = await boqApi.get('/GetBillingFrequencies');
    return (data ?? []).map(createLookupItem);
  },

  // REAL API
  async getBoqItemStatuses() {
    const data = await boqApi.get('/GetBoqItemStatuses');
    return (data ?? []).map(createBoqItemStatus);
  },

  // REAL API
  async getInvoiceStatuses() {
    const data = await invoicesApi.get('/GetInvoiceStatuses');
    return (data ?? []).map(createInvoiceStatus);
  },

  // TODO: add more lookup methods here as new endpoints become available
  // e.g. async getProjectStatuses() { ... }
  //      async getInvoiceTypes()     { ... }
};
