export const controlClass =
  'w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary';

export function parseTargetIds(raw) {
  const seen = new Set();
  for (const part of String(raw ?? '').split(/[\s,;]+/)) {
    const id = part.trim();
    if (id) seen.add(id);
  }
  return [...seen];
}
