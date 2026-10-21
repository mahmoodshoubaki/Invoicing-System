'use client';

import { memo } from 'react';

import TablePagination from '@/components/common/TablePagination';
import { pageInfo } from '@/lib/pageInfo';

/**
 * Server-side paging by `skip` and `take` — drawn as the tables' own numbered
 * footer since 2026-10-21, with the page size to choose when the list lets
 * the reader set it (`onTakeChange`), so every paged list in the app looks
 * and works the same.
 *
 * @param {{
 *   skip: number, take: number, total: number, onChange: (skip: number) => void,
 *   onTakeChange?: ((take: number) => void)|null, busy?: boolean,
 * }} props
 */
function Pager({ skip, take, total, onChange, onTakeChange = null, busy = false }) {
  const info = pageInfo(Math.floor(skip / take) + 1, take, total, (page) => onChange((page - 1) * take), onTakeChange);
  if (!info) return null;
  return <TablePagination {...info} busy={busy} />;
}

export default memo(Pager);
