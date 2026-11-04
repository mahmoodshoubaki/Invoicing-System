import { createApiClient } from '@/lib/apiClient';
import { mapBackgroundJob } from '@/models/notification';

const api = createApiClient('/api/BackgroundJobs');

const BY_MODULE = {
  Workflow: { update: '/UpdateWorkflowJob', runNow: '/RunWorkflowJobNow' },
  Notifications: { update: '/UpdateNotificationJob', runNow: '/RunNotificationJobNow' },
};

function endpointsFor(module) {
  const endpoints = BY_MODULE[module];
  if (!endpoints) throw new Error(`No background-job endpoints for module "${module}".`);
  return endpoints;
}

export const backgroundJobsRepository = {
  async getJobs() {
    const data = await api.get('/GetJobs');
    return (data?.jobs ?? []).map(mapBackgroundJob);
  },

  async updateJob(job, { schedule, isOn }) {
    const data = await api.post(endpointsFor(job.module).update, { jobKey: job.jobKey, schedule, isOn });
    return mapBackgroundJob(data);
  },

  async runNow(job) {
    const data = await api.post(endpointsFor(job.module).runNow, { jobKey: job.jobKey });
    return mapBackgroundJob(data);
  },
};
