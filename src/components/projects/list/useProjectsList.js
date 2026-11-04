'use client';

import { useCallback, useState } from 'react';

import { useDebounce } from '@/hooks/useDebounce';
import { useServerPage } from '@/hooks/useServerPage';
import { projectRepository } from '@/repositories/projectRepository';

/**
 * The Projects page's list, searched and filtered by the server a page at a
 * time. `allTotal` is the unfiltered count, once a page without filters has
 * been read.
 */
export function useProjectsList() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [statuses, setStatuses] = useState([]);
  const [allTotal, setAllTotal] = useState(null);
  const query = useDebounce(search.trim(), 300);

  const fetchPage = useCallback(async ({ skip, take }) => {
    const page = await projectRepository.getProjectsPage({ search: query, status, skip, take });
    setStatuses(page.statuses);
    if (!query && !status) setAllTotal(page.total);
    return { rows: page.projects, total: page.total };
  }, [query, status]);
  const list = useServerPage(fetchPage, { key: `${query}|${status}` });

  const clear = useCallback(() => {
    setSearch('');
    setStatus('');
  }, []);

  return {
    ...list,
    search,
    setSearch,
    status,
    setStatus,
    statuses,
    allTotal,
    filtered: Boolean(search.trim() || status),
    clear,
  };
}
