'use client';

import { useEffect, useState } from 'react';

import { useDebounce } from '@/hooks/useDebounce';
import { identityRepository } from '@/repositories/identityRepository';

/**
 * @returns {{ users: Object[], total: number, loading: boolean, error: Error|null }}
 */
export function useADUserSearch(query, enabled, take) {
  const search = useDebounce(query.trim(), 250);
  const key = `${search}|${take}`;
  const [state, setState] = useState({ key: null, users: [], total: 0, error: null });

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    identityRepository.searchUnregisteredADUsers({ search, take })
      .then(({ users, total }) => {
        if (!cancelled) setState({ key, users, total, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ key, users: [], total: 0, error });
      });
    return () => { cancelled = true; };
  }, [enabled, key, search, take]);

  return { users: state.users, total: state.total, loading: enabled && state.key !== key, error: state.error };
}
