/**
 * Values typed by hand for a notification type's placeholders (2026-10-08).
 *
 * Every place a workflow picks a type — a Send notification step, a human
 * task's five notifications, the run's three — can carry `placeholderValues`:
 * `{ "Note": "Approve {{ TaskTitle }} by Friday" }`. The rules, from the backend:
 *
 *   - a value is plain text, a `{{ name }}` from the run, or both mixed;
 *   - a value that is ONLY one `{{ name }}` keeps its kind, so a list stays a
 *     list and a table in the template can loop over it;
 *   - an empty value, or a placeholder left out, keeps the template's default;
 *   - nothing here is refused when the workflow is saved.
 *
 * So only filled boxes are written, and names are matched ignoring case, the
 * way the engine matches them.
 */

const same = (a, b) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase();

/**
 * The values with one box changed. An emptied box is taken out rather than
 * kept as "" — empty means "use the default", and leaving it out says so.
 *
 * @param {Object|undefined} values
 * @param {string} key
 * @param {string} text
 * @returns {Object}
 */
export function setPlaceholderValue(values, key, text) {
  const next = {};
  for (const [name, value] of Object.entries(values ?? {})) {
    if (!same(name, key)) next[name] = value;
  }
  if (text !== '') next[key] = text;
  return next;
}

/** The value typed for a placeholder, matched ignoring case; '' when there is none. */
export function placeholderValueOf(values, key) {
  const hit = Object.entries(values ?? {}).find(([name]) => same(name, key));
  return hit ? String(hit[1] ?? '') : '';
}

/**
 * One row per box to show for a type.
 *
 * The type's own placeholders come first, in its order, each with its default.
 * A value typed for a placeholder the type no longer has is kept and listed
 * after them as `stale` — the engine ignores it, but deleting what somebody
 * typed without telling them would be worse.
 *
 * @param {Array<{key: string, value: string}>} placeholders  the type's, from GetTypes
 * @param {Object|undefined} values  what is saved
 * @returns {Array<{ key: string, defaultValue: string, value: string, stale: boolean }>}
 */
export function placeholderRows(placeholders, values) {
  const rows = (placeholders ?? []).map((p) => ({
    key: p.key,
    defaultValue: p.value ?? '',
    value: placeholderValueOf(values, p.key),
    stale: false,
  }));

  for (const [name, value] of Object.entries(values ?? {})) {
    if (!rows.some((r) => same(r.key, name))) {
      rows.push({ key: name, defaultValue: '', value: String(value ?? ''), stale: true });
    }
  }
  return rows;
}

/**
 * What fills a placeholder left empty, if the run has a value of that name.
 * The engine hands the template everything it can read and matches by name, so
 * an empty `InvoiceNumber` box is filled from an `invoiceNumber` field, not
 * from the default.
 *
 * @param {string} key
 * @param {Array<{name: string, label?: string}>} available
 */
export function runValueFor(key, available) {
  return (available ?? []).find((v) => same(v.name, key)) ?? null;
}

/**
 * A picked type's entry with new values. The property is left off when nothing
 * is typed, so an untouched entry stays `{ typeKey }`.
 *
 * @param {Object} entry  `{ typeKey, …, placeholderValues? }`
 * @param {Object} values
 */
export function withPlaceholderValues(entry, values) {
  const rest = { ...(entry ?? {}) };
  delete rest.placeholderValues;
  return Object.keys(values ?? {}).length > 0 ? { ...rest, placeholderValues: values } : rest;
}
