/**
 * The page sizes a paged table offers (2026-10-21). Every list endpoint takes
 * up to 200 rows a page, so each of these is always honoured.
 */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * The `pagination` object Table takes, for `total` rows at `pageSize` a page —
 * or undefined when they all fit on one page, which is when the other tables
 * show no footer either.
 *
 * Given `onPageSizeChange` (a list paged by the server, 2026-10-21) the footer
 * offers the page sizes too, and stays while there is more than the smallest
 * page — so a larger size can always be set back.
 */
export function pageInfo(page, pageSize, total, onChange, onPageSizeChange = null) {
  if (total <= (onPageSizeChange ? Math.min(pageSize, PAGE_SIZE_OPTIONS[0]) : pageSize)) return undefined;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    page: current,
    totalPages,
    total,
    from: (current - 1) * pageSize + 1,
    to: Math.min(current * pageSize, total),
    onChange,
    ...(onPageSizeChange ? { pageSize, onPageSizeChange } : {}),
  };
}
