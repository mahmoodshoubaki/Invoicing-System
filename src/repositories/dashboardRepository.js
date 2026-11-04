import { createApiClient } from '@/lib/apiClient';
import {
  mapDelayedCycles, mapFinancialSummary, mapInvoiceSummary, mapMonthlyTrend, mapPendingApprovals, mapSlaViolations,
} from '@/models/dashboard';

const api = createApiClient('/api/Dashboards');

const params = (entries) => Object.fromEntries(Object.entries(entries).filter(([, v]) => v != null && v !== ''));

export const dashboardRepository = {
  async getFinancialSummary({ month = null, year = null, projectStatus = null } = {}) {
    return mapFinancialSummary(await api.get('/GetFinancialSummary', params({ month, year, projectStatus })));
  },

  async getInvoiceSummary({ latest = 5, projectStatus = null } = {}) {
    return mapInvoiceSummary(await api.get('/GetInvoiceSummary', params({ latest, projectStatus })));
  },

  async getMonthlyTrend({ months = 12, month = null, year = null, projectStatus = null } = {}) {
    return mapMonthlyTrend(await api.get('/GetMonthlyTrend', params({ months, month, year, projectStatus })));
  },

  async getDelayedCycles({ projectStatus = null, skip = 0, take = 50 } = {}) {
    return mapDelayedCycles(await api.get('/GetDelayedCycles', params({ projectStatus, skip, take })));
  },

  async getSlaViolations({ projectStatus = null, skip = 0, take = 50 } = {}) {
    return mapSlaViolations(await api.get('/GetSlaViolations', params({ projectStatus, skip, take })));
  },

  async getPendingApprovals({ projectStatus = null, type = null, skip = 0, take = 50 } = {}) {
    return mapPendingApprovals(await api.get('/GetPendingApprovals', params({ projectStatus, type, skip, take })));
  },
};
