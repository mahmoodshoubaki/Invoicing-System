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
  { prefix: '/projects', module: 'Projects', action: 'View' },
  { prefix: '/invoices', module: 'Invoices', action: 'View' },
  { prefix: '/workflow/builder', module: 'Workflow', action: 'Manage' },
  { prefix: '/workflow', module: 'Workflow', action: 'View' },
  { prefix: '/admin/roles', module: 'Role', action: 'View' },
  { prefix: '/admin/workflow', module: 'Workflow', action: 'Manage' },
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
  const allowed = !route || can(route.module, route.action);

  useEffect(() => {
    if (!allowed) router.replace('/unauthorized');
  }, [allowed, router]);

  if (!allowed) return null;

  return children;
}
