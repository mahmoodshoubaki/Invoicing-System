'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/common/LoadingSpinner';

/**
 * Client-side auth gate for the dashboard route group.
 *
 * Route protection used to live in Next middleware, reading a JS-writable
 * "auth-token" cookie. Now that the access token lives only in memory/
 * sessionStorage and the real session is an httpOnly refresh-token cookie
 * middleware can't meaningfully interpret, gating has to happen here instead,
 * once the client actually knows whether it holds an access token.
 *
 * This must actually withhold `children` until authentication is confirmed —
 * rendering them and redirecting away a tick later (via a sibling component
 * that only watches and never blocks) would flash real protected content to
 * an unauthenticated visitor first. Not a hypothetical: that's exactly what
 * happened before this rewrite.
 */
export default function AuthGuard({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return children;
}
