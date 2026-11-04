import { createApiClient } from '@/lib/apiClient';
import {
  mapDelayedCycles, mapFinancialSummary, mapInvoiceSummary, mapMonthlyTrend, mapPendingApprovals, mapSlaViolations,
} from '@/models/dashboard';

const api = createApiClient('/api/Dashboards');

const params = (entries) => Object.fromEntries(Object.entries(entries).filter(([, v]) => v != null && v !== ''));

/** The home page's figures, each scoped to the projects the user can see. */
export const dashboardRepository = {
  /** Projects.View. One month (this month by default), optionally one project status. */
  async getFinancialSummary({ month = null, year = null, projectStatus = null } = {}) {
    return mapFinancialSummary(await api.get('/GetFinancialSummary', params({ month, year, projectStatus })));
  },

  /** Invoices.View. All time; `latest` in-progress invoices, newest first. */
  async getInvoiceSummary({ latest = 5, projectStatus = null } = {}) {
    return mapInvoiceSummary(await api.get('/GetInvoiceSummary', params({ latest, projectStatus })));
  },

  /** Projects.View. `months` months (1–24) ending with month/year, oldest first. */
  async getMonthlyTrend({ months = 12, month = null, year = null, projectStatus = null } = {}) {
    return mapMonthlyTrend(await api.get('/GetMonthlyTrend', params({ months, month, year, projectStatus })));
  },

  /** boqs.View. One page of late invoicing cycles, the most late first. */
  async getDelayedCycles({ projectStatus = null, skip = 0, take = 50 } = {}) {
    return mapDelayedCycles(await api.get('/GetDelayedCycles', params({ projectStatus, skip, take })));
  },

  /** WorkflowInstances.View. One page of past-due workflow tasks, the most late first. */
  async getSlaViolations({ projectStatus = null, skip = 0, take = 50 } = {}) {
    return mapSlaViolations(await api.get('/GetSlaViolations', params({ projectStatus, skip, take })));
  },

  /**
   * Any of Invoices.View, ChangeRequests.View, boqs.View. One page of open invoices, change requests and BOQ items,
   * newest first; `type` (invoice | changeRequest | boqItem) narrows the page, never `byType`.
   */
  async getPendingApprovals({ projectStatus = null, type = null, skip = 0, take = 50 } = {}) {
    return mapPendingApprovals(await api.get('/GetPendingApprovals', params({ projectStatus, type, skip, take })));
  },
};
