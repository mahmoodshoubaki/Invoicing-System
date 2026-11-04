'use client';

import { useCallback, useState } from 'react';

import { useServerPage } from '@/hooks/useServerPage';
import { changeRequestRepository } from '@/repositories/changeRequestRepository';

/**
 * A change request's earlier versions, a page at a time, and the one picked to read.
 *
 * @param {number|string} changeRequestId
 * @param {boolean} enabled
 */
export function useChangeRequestHistory(changeRequestId, enabled) {
  const fetchPage = useCallback(async (query) => {
    const { history, total } = await changeRequestRepository.getChangeRequestHistory(changeRequestId, query);
    return { rows: history, total };
  }, [changeRequestId]);
  const list = useServerPage(fetchPage, { key: String(changeRequestId), initialPageSize: 10, enabled });
  const [picked, setPicked] = useState(null);
  const selected = list.rows.find((row) => row.version === picked) ?? null;

  return { ...list, selected, pick: setPicked };
}
