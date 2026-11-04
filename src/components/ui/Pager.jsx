'use client';

import { memo } from 'react';

import TablePagination from '@/components/common/TablePagination';
import { pageInfo } from '@/lib/pageInfo';

/**
 * @param {{ skip: number, take: number, total: number, onChange: (skip: number) => void, onTakeChange?: ((take: number) => void)|null, busy?: boolean, }} props
 */
function Pager({ skip, take, total, onChange, onTakeChange = null, busy = false }) {
  const info = pageInfo(Math.floor(skip / take) + 1, take, total, (page) => onChange((page - 1) * take), onTakeChange);
  if (!info) return null;
  return <TablePagination {...info} busy={busy} />;
}

export default memo(Pager);
