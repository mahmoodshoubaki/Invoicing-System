'use client';

import { ExternalLink } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import HangfireFrame from '@/components/admin/jobs/HangfireFrame';
import { ROUTES } from '@/constants/routes';
import { withBasePath } from '@/constants/appConfig';

const BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Admin', href: ROUTES.ADMIN },
  { label: 'Background jobs', href: ROUTES.BACKGROUND_JOBS },
  { label: 'Hangfire dashboard' },
];

const ACTIONS = (
  <a href={withBasePath(ROUTES.HANGFIRE)} target="_blank" rel="noopener noreferrer">
    <Button variant="outline" size="sm" icon={ExternalLink}>Open in a new tab</Button>
  </a>
);

export default function HangfireDashboardPage() {
  return (
    <div>
      <PageHeader
        title="Hangfire dashboard"
        subtitle="Queues, retries, failed jobs and the servers running them. Times are the server's."
        breadcrumbs={BREADCRUMBS}
        actions={ACTIONS}
      />
      <HangfireFrame />
    </div>
  );
}
