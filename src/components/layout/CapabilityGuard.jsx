'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';

const ROUTE_CAPABILITIES = [
  { prefix: '/dashboard/delayed-cycles', module: 'Boqs', action: 'View' },
  { prefix: '/dashboard/sla-violations', module: 'WorkflowInstances', action: 'View' },
  {
    prefix: '/dashboard/pending-approvals',
    anyOf: [
      { module: 'Invoices', action: 'View' },
      { module: 'ChangeRequests', action: 'View' },
      { module: 'Boqs', action: 'View' },
    ],
  },
  { test: (p) => /^\/projects\/[^/]+\/boq\/new(\/|$)/.test(p), module: 'Boqs', action: 'Create' },
  { test: (p) => /^\/projects\/[^/]+\/boq\/[^/]+\/edit(\/|$)/.test(p), module: 'System', action: 'Administrator' },
  { test: (p) => /^\/projects\/[^/]+\/boq(\/|$)/.test(p), module: 'Boqs', action: 'View' },
  { test: (p) => /^\/projects\/[^/]+\/invoices\/new(\/|$)/.test(p), module: 'Invoices', action: 'Create' },
  { test: (p) => /^\/projects\/[^/]+\/invoices\/[^/]+\/edit(\/|$)/.test(p), module: 'System', action: 'Administrator' },
  { test: (p) => /^\/projects\/[^/]+\/change-requests\/new(\/|$)/.test(p), module: 'ChangeRequests', action: 'Create' },
  { test: (p) => /^\/projects\/[^/]+\/change-requests\/[^/]+\/edit(\/|$)/.test(p), module: 'System', action: 'Administrator' },
  { test: (p) => /^\/projects\/[^/]+\/change-requests(\/|$)/.test(p), module: 'ChangeRequests', action: 'View' },
  { prefix: '/projects', module: 'Projects', action: 'View' },
  { prefix: '/invoices', module: 'Invoices', action: 'View' },
  { prefix: '/workflow/tasks', module: 'WorkflowTasks', action: 'View' },
  { prefix: '/workflow', module: 'Workflow', action: 'View' },
  { prefix: '/admin/roles', module: 'Role', action: 'View' },
  {
    prefix: '/admin/groups',
    anyOf: [
      { module: 'Group', action: 'View' },
      { module: 'Group', action: 'Manage' },
    ],
  },
  { prefix: '/admin/workflow/workflows', module: 'Workflow', action: 'View' },
  {
    test: (p) => p === '/admin/workflow',
    anyOf: [
      { module: 'Workflow', action: 'View' },
      { module: 'Workflow', action: 'Manage' },
    ],
  },
  { prefix: '/admin/workflow', module: 'Workflow', action: 'Manage' },
  { prefix: '/admin/jobs/dashboard', module: 'System', action: 'Administrator' },
  { prefix: '/admin/jobs', module: 'System', action: 'Manage Jobs' },
  { prefix: '/admin/monitoring/runs', module: 'WorkflowInstances', action: 'View' },
  { prefix: '/admin/monitoring/trace', module: 'WorkflowInstances', action: 'View' },
  { prefix: '/admin/monitoring/deliveries', module: 'Notifications', action: 'Manage Settings' },
  {
    prefix: '/admin/monitoring/audit',
    anyOf: [
      { module: 'Notifications', action: 'Manage Settings' },
      { module: 'Workflow', action: 'Manage' },
    ],
  },
  {
    test: (p) => p === '/admin/monitoring',
    anyOf: [
      { module: 'WorkflowInstances', action: 'View' },
      { module: 'Notifications', action: 'Manage Settings' },
      { module: 'Workflow', action: 'Manage' },
    ],
  },
  { prefix: '/admin/notifications/types', module: 'Notifications', action: 'View' },
  { prefix: '/admin/notifications/senders', module: 'Notifications', action: 'Manage' },
  { prefix: '/admin/notifications/settings', module: 'Notifications', action: 'Manage' },
  {
    test: (p) => p === '/admin/notifications',
    anyOf: [
      { module: 'Notifications', action: 'View' },
      { module: 'Notifications', action: 'Manage' },
    ],
  },
  { prefix: '/admin', module: 'System', action: 'Administrator' },
];

export default function CapabilityGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = usePermission();

  const route = ROUTE_CAPABILITIES.find(({ prefix, test }) => (test ? test(pathname) : pathname.startsWith(prefix)));
  const allowed = !route || (route.anyOf
    ? route.anyOf.some(({ module, action }) => can(module, action))
    : can(route.module, route.action));

  useEffect(() => {
    if (!allowed) router.replace('/unauthorized');
  }, [allowed, router]);

  if (!allowed) return null;

  return children;
}
