/**
 * Editing the Workflow fields page (2026-10-13): the rows as loaded, the
 * admin's changes on top, and what a save sends.
 *
 * The rows come a page at a time from the server, so an edit keeps the row as
 * it was loaded beside the change (`{ base, patch }`, keyed by name). A row
 * changed on page 1 is then still saved, whole, while page 3 is showing — the
 * server replaces a row as a whole (label, on, person, fillable).
 */

export const LABEL_MAX = 100;

/** A row as it reads now: as loaded, with the admin's change on top. */
export function currentRow(row, edits) {
  const edit = edits?.[row.name];
  return edit ? { ...row, ...edit.patch } : row;
}

/** An edit to one row, dropped again when it puts the row back as it was loaded. */
export function applyEdit(edits, row, patch) {
  const existing = edits?.[row.name];
  const base = existing?.base ?? row;
  const next = { ...(existing?.patch ?? {}), ...patch };
  const reverted = Object.entries(next).every(([k, v]) => base[k] === v);
  const all = { ...(edits ?? {}) };
  if (reverted) delete all[row.name];
  else all[row.name] = { base, patch: next };
  return all;
}

/** Every changed row, on whatever page it is — each whole. */
export function changedRows(edits) {
  return Object.values(edits ?? {}).map(({ base, patch }) => ({ ...base, ...patch }));
}

/** What is wrong with a row before it is sent, as the server would say it; null when nothing. */
export function rowProblem(row) {
  const label = String(row.label ?? '').trim();
  if (!label) return `'${row.name}' needs a label.`;
  if (label.length > LABEL_MAX) return `The label of '${row.name}' can be at most ${LABEL_MAX} characters.`;
  if (row.isUser && row.cannotBePersonReason) return row.cannotBePersonReason;
  if (row.fillable && row.cannotFillReason) return row.cannotFillReason;
  return null;
}

/** The page's rows with the saved ones put in their place — a save answers with the changed rows only. */
export function mergeSavedRows(rows, saved) {
  const byName = new Map((saved ?? []).map((r) => [r.name, r]));
  return (rows ?? []).map((r) => byName.get(r.name) ?? r);
}

/** A refusal's errors (WF-057), keyed by field name — plus anything keyed otherwise. */
export function splitFieldErrors(errors, names) {
  const byName = {};
  const other = [];
  for (const [key, messages] of Object.entries(errors ?? {})) {
    const text = (Array.isArray(messages) ? messages : [messages]).filter(Boolean).join(' ');
    if (!text) continue;
    const name = (names ?? []).find((n) => n.toLowerCase() === String(key).toLowerCase());
    if (name) byName[name] = text;
    else other.push(text);
  }
  return { byName, other };
}
