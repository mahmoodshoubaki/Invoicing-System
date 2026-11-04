export const LABEL_MAX = 100;

export function currentRow(row, edits) {
  const edit = edits?.[row.name];
  return edit ? { ...row, ...edit.patch } : row;
}

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

export function changedRows(edits) {
  return Object.values(edits ?? {}).map(({ base, patch }) => ({ ...base, ...patch }));
}

export function rowProblem(row) {
  const label = String(row.label ?? '').trim();
  if (!label) return `'${row.name}' needs a label.`;
  if (label.length > LABEL_MAX) return `The label of '${row.name}' can be at most ${LABEL_MAX} characters.`;
  if (row.isUser && row.cannotBePersonReason) return row.cannotBePersonReason;
  if (row.fillable && row.cannotFillReason) return row.cannotFillReason;
  return null;
}

export function mergeSavedRows(rows, saved) {
  const byName = new Map((saved ?? []).map((r) => [r.name, r]));
  return (rows ?? []).map((r) => byName.get(r.name) ?? r);
}

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
