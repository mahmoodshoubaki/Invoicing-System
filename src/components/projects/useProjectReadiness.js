'use client';

import { useMemo } from 'react';

import { missingProjectInfo } from '@/lib/projectReadiness';
import { useProjectHeader } from './useProjectHeader';

/**
 * @param {string} projectCode
 * @returns {{ header: Object|null, status: 'loading'|'ready'|'error', missing: string[], checking: boolean, failed: boolean, ready: boolean, }}
 */
export function useProjectReadiness(projectCode) {
  const { status, header } = useProjectHeader(projectCode);
  const missing = useMemo(() => (header ? missingProjectInfo(header) : []), [header]);
  return {
    header,
    status,
    missing,
    checking: status === 'loading',
    failed: status === 'error',
    ready: status === 'ready' && missing.length === 0,
  };
}
