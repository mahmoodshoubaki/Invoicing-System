'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';

/**
 * Maps a route to the capability required to view it. This is routing
 * wiring (which page needs which capability) — not permission data itself,
 * which comes entirely from the API. First match wins, so more-specific
 * patterns go before broader prefixes.
 */
const ROUTE_CAPABILITIES = [
  { test: (p) => /^\/projects\/[^/]+\/boq\/new(\/|$)/.test(p), module: 'Boqs', action: 'Create' },
  { test: (p) => /^\/projects\/[^/]+\/boq\/[^/]+\/edit(\/|$)/.test(p), module: 'Boqs', action: 'Update' },
  { test: (p) => /^\/projects\/[^/]+\/boq(\/|$)/.test(p), module: 'Boqs', action: 'View' },
  { test: (p) => /^\/projects\/[^/]+\/invoices\/new(\/|$)/.test(p), module: 'Invoices', action: 'Create' },
  // Change requests (2026-10-19): raising one, editing one sent back, reading one.
  { test: (p) => /^\/projects\/[^/]+\/change-requests\/new(\/|$)/.test(p), module: 'ChangeRequests', action: 'Create' },
  { test: (p) => /^\/projects\/[^/]+\/change-requests\/[^/]+\/edit(\/|$)/.test(p), module: 'ChangeRequests', action: 'Update' },
  { test: (p) => /^\/projects\/[^/]+\/change-requests(\/|$)/.test(p), module: 'ChangeRequests', action: 'View' },
  { prefix: '/projects', module: 'Projects', action: 'View' },
  { prefix: '/invoices', module: 'Invoices', action: 'View' },
  // The workflow module has separate capability modules, so this must precede
  // the broad /workflow prefix below. Without it a user holding only
  // WorkflowTasks.View — exactly the permission the tasks screen needs — would
  // be bounced to /unauthorized for lacking Workflow.View, which gates workflow
  // *definitions* and has nothing to do with their to-do list.
  { prefix: '/workflow/tasks', module: 'WorkflowTasks', action: 'View' },
  { prefix: '/workflow', module: 'Workflow', action: 'View' },
  { prefix: '/admin/roles', module: 'Role', action: 'View' },
  // Admin › Workflow (2026-10-13). The workflows list is Workflow.View — somebody
  // who only reads workflows is not an administrator — and the area's landing
  // route only redirects, to the first page this person may read. The builder,
  // the fields, the engine limits and the approved domains are Workflow.Manage.
  { prefix: '/admin/workflow/workflows', module: 'Workflow', action: 'View' },
  {
    test: (p) => p === '/admin/workflow',
    anyOf: [
      { module: 'Workflow', action: 'View' },
      { module: 'Workflow', action: 'Manage' },
    ],
  },
  { prefix: '/admin/workflow', module: 'Workflow', action: 'Manage' },
  { prefix: '/admin/jobs', module: 'System', action: 'Manage Jobs' },
  // Admin › Monitoring — each page asks for what reading it needs, ahead of the
  // broad /admin rule (somebody who only watches runs is not an administrator).
  // The trace reads runs AND notifications; the backend serves it under the runs permission.
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
  // The area's landing route only redirects, to the first page this person may read.
  {
    test: (p) => p === '/admin/monitoring',
    anyOf: [
      { module: 'WorkflowInstances', action: 'View' },
      { module: 'Notifications', action: 'Manage Settings' },
      { module: 'Workflow', action: 'Manage' },
    ],
  },
  // Each notifications admin page asks for what READING it needs; the pages
  // then hide the controls that change things without the stronger permission.
  { prefix: '/admin/notifications/types', module: 'Notifications', action: 'View' },
  { prefix: '/admin/notifications/senders', module: 'Notifications', action: 'Manage' },
  { prefix: '/admin/notifications/settings', module: 'Notifications', action: 'Manage' },
  // The area's landing route only redirects, to the first page this person may read.
  {
    test: (p) => p === '/admin/notifications',
    anyOf: [
      { module: 'Notifications', action: 'View' },
      { module: 'Notifications', action: 'Manage' },
    ],
  },
  { prefix: '/admin', module: 'System', action: 'Administrator' },
];

/**
 * Client-side page gate: withholds `children` unless the current route's
 * required capability is granted, redirecting to /unauthorized otherwise.
 *
 * Mounted inside AuthGuard, which only renders this once Identity/me has
 * resolved — capabilities are fetched in that same call, so there's no
 * separate loading state to wait for here.
 */
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
