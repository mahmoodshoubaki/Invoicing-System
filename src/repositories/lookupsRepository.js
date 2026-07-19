import { createApiClient } from '@/lib/apiClient';
import { createLookupItem } from '@/models/lookup';

const boqApi = createApiClient('/api/Boqs');

export const lookupsRepository = {
  // REAL API
  async getBillingFrequencies() {
    const data = await boqApi.get('/GetBillingFrequencies');
    return (data ?? []).map(createLookupItem);
  },
  
  async getBoqItemStatuses() {
    const data = await boqApi.get('/GetBoqItemStatuses');
    return (data ?? []).map(createLookupItem);
  },

  // TODO: add more lookup methods here as new endpoints become available
  // e.g. async getProjectStatuses() { ... }
  //      async getInvoiceTypes()     { ... }
};
