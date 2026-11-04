'use client';

import { useCallback, useEffect, useState } from 'react';

import { pageParams } from '@/lib/fetchAllPages';

/**
 * One page of a list the server pages. A new `key` (a filter, a record id)
 * goes back to page 1. `fetchPage` should be stable (useCallback) and change
 * with the key. While a page loads, `rows` is empty; `total` keeps the last
 * count so a footer can stay in place. Anything else `fetchPage` returns
 * besides rows and total comes back as `meta`, kept the same way.
 *
 * @param {(query: { skip: number, take: number }) => Promise<{ rows: Array, total: number }>} fetchPage
 * @param {{ key?: string, initialPageSize?: number, enabled?: boolean }} [options]
 * @returns {{
 *   rows: Array, total: number, meta: Object, page: number, pageSize: number, loading: boolean, error: Error|null,
 *   setPage: (page: number) => void, setPageSize: (size: number) => void, reload: () => void,
 * }}
 */
export function useServerPage(fetchPage, { key = '', initialPageSize = 25, enabled = true } = {}) {
  const [paging, setPaging] = useState({ key, page: 1, pageSize: initialPageSize });
  const [reloads, setReloads] = useState(0);
  const [result, setResult] = useState({ sig: null, rows: [], total: 0, meta: {}, error: null });

  const page = paging.key === key ? paging.page : 1;
  const { pageSize } = paging;
  const sig = `${key}|${page}|${pageSize}|${reloads}`;

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    fetchPage(pageParams(page, pageSize))
      .then(({ rows, total, ...meta }) => {
        if (!cancelled) setResult({ sig, rows: rows ?? [], total: Number(total) || 0, meta, error: null });
      })
      .catch((error) => {
        if (!cancelled) setResult((prev) => ({ ...prev, sig, error }));
      });
    return () => { cancelled = true; };
  }, [enabled, fetchPage, page, pageSize, sig]);

  const setPage = useCallback((next) => setPaging({ key, page: next, pageSize }), [key, pageSize]);
  const setPageSize = useCallback((size) => setPaging({ key, page: 1, pageSize: size }), [key]);
  const reload = useCallback(() => setReloads((n) => n + 1), []);

  const current = result.sig === sig;
  return {
    rows: current ? result.rows : [],
    total: result.total,
    meta: result.meta,
    page,
    pageSize,
    loading: enabled && !current,
    error: current ? result.error : null,
    setPage,
    setPageSize,
    reload,
  };
}
