/** The look of the boxes in the start-run dialog. */
export const controlClass =
  'w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary';

/**
 * The records a run is about, out of what somebody typed.
 *
 * A run is about a **set** as of 2026-09-13, so this box takes more than one.
 * Splitting on commas, semicolons and whitespace alike is deliberate: a list
 * pasted out of a spreadsheet arrives one-per-line, one out of a URL arrives
 * comma-separated, and guessing wrong turns the whole paste into a single
 * nonsense id that only fails at the server.
 *
 * Duplicates collapse — the same record twice in one run means nothing, and
 * silently sending it would make the count on screen disagree with the run.
 */
export function parseTargetIds(raw) {
  const seen = new Set();
  for (const part of String(raw ?? '').split(/[\s,;]+/)) {
    const id = part.trim();
    if (id) seen.add(id);
  }
  return [...seen];
}
