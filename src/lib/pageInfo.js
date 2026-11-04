export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

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
