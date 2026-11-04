'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * One filter kept in the address as `?name=value`, so a link can open the page
 * already filtered and the back button returns to it. '' when absent.
 *
 * @param {string} name
 * @returns {[string, (next: string) => void]}
 */
export function useUrlParam(name) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get(name) ?? '';

  const setValue = useCallback((next) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set(name, next);
    else params.delete(name);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [name, pathname, router, searchParams]);

  return [value, setValue];
}
