'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import PillTabs from '@/components/ui/PillTabs';
import ConfigChangesView from '@/components/audit/ConfigChangesView';
import { SendRequests } from '@/components/monitoring/audit/SendRequests';
import { usePermission } from '@/hooks/usePermission';
import { allow, WORKFLOW_PERMISSIONS } from '@/constants/workflowPermissions';
import { NOTIFICATION_CONFIG_AREAS, NOTIFICATION_PERMISSIONS, WORKFLOW_CONFIG_AREAS } from '@/constants/notifications';
import { notificationRepository } from '@/repositories/notificationRepository';
import { workflowRepository } from '@/repositories/workflowRepository';

/**
 * The audit's parts, each with what reading it needs. Passwords and secret keys
 * show only as "changed", never their value.
 */
const VIEWS = [
  { key: 'requests', label: 'Send requests', permission: NOTIFICATION_PERMISSIONS.MANAGE_SETTINGS },
  { key: 'notifications', label: 'Notification changes', permission: NOTIFICATION_PERMISSIONS.MANAGE_SETTINGS },
  { key: 'workflow', label: 'Workflow changes', permission: WORKFLOW_PERMISSIONS.MANAGE },
];

// Module-level, so each is one stable function for the list to load with.
const loadNotificationChanges = (filters) => notificationRepository.getConfigChanges(filters);
const loadWorkflowChanges = (filters) => workflowRepository.getConfigChanges(filters);

function AuditContent() {
  const params = useSearchParams();
  const { can } = usePermission();
  const views = VIEWS.filter((v) => allow(can, v.permission));
  const asked = params.get('view');
  const [view, setView] = useState(() => (views.some((v) => v.key === asked) ? asked : views[0]?.key ?? null));

  // Type names for the requests filter. GetTypes needs Notifications.View; without it the filter takes a number.
  const canReadTypes = allow(can, NOTIFICATION_PERMISSIONS.VIEW);
  const [types, setTypes] = useState(null);
  useEffect(() => {
    if (canReadTypes) notificationRepository.getTypes().then(setTypes).catch(() => setTypes(null));
  }, [canReadTypes]);

  return (
    <div>
      <PageHeader
        title="Audit"
        subtitle="Who changed what — in notifications and in workflow — and every request to send, including who got nothing and why."
      />
      {views.length > 1 && (
        <div className="mb-3">
          <PillTabs tabs={views.map(({ key, label }) => ({ key, label }))} value={view} onChange={setView} />
        </div>
      )}
      <Card padding={false}>
        {view === 'requests' && <SendRequests types={types} />}
        {/* Keyed so each source starts with its own filters. */}
        {view === 'notifications' && <ConfigChangesView key="notifications" load={loadNotificationChanges} areas={NOTIFICATION_CONFIG_AREAS} />}
        {view === 'workflow' && <ConfigChangesView key="workflow" load={loadWorkflowChanges} areas={WORKFLOW_CONFIG_AREAS} />}
      </Card>
    </div>
  );
}

/** Admin › Monitoring › Audit. `useSearchParams` needs a Suspense boundary above it. */
export default function AuditPage() {
  return (
    <Suspense fallback={null}>
      <AuditContent />
    </Suspense>
  );
}
