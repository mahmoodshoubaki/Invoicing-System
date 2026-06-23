'use client';

import { useState, useMemo } from 'react';

export function usePagination(data, pageSize = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil((data?.length || 0) / pageSize);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (data || []).slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const pagination = {
    page,
    totalPages,
    total: data?.length || 0,
    from: Math.min((page - 1) * pageSize + 1, data?.length || 0),
    to: Math.min(page * pageSize, data?.length || 0),
    onChange: (p) => setPage(Math.max(1, Math.min(p, totalPages))),
  };

  // Reset to page 1 when data changes significantly
  const reset = () => setPage(1);

  return { paginatedData, pagination, reset };
}
