export const MAX_TAKE = 200;

/**
 * @param {(skip: number, take: number) => Promise<{ rows: Array, total: number }>} fetchPage
 * @returns {Promise<Array>}
 */
export async function fetchAllPages(fetchPage, take = MAX_TAKE) {
  const first = await fetchPage(0, take);
  const rows = first?.rows ?? [];
  const total = Number(first?.total) || 0;
  if (rows.length === 0 || rows.length >= total) return rows;

  const skips = [];
  for (let skip = rows.length; skip < total; skip += take) skips.push(skip);
  const rest = await Promise.all(skips.map((skip) => fetchPage(skip, take)));
  return rows.concat(...rest.map((page) => page?.rows ?? []));
}

export function pageParams(page, pageSize) {
  return { skip: Math.max(0, (page - 1) * pageSize), take: pageSize };
}
