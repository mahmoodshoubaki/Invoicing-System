const same = (a, b) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase();

/**
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

export function placeholderValueOf(values, key) {
  const hit = Object.entries(values ?? {}).find(([name]) => same(name, key));
  return hit ? String(hit[1] ?? '') : '';
}

/**
 * @param {Array<{key: string, value: string}>} placeholders
 * @param {Object|undefined} values
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
 * @param {string} key
 * @param {Array<{name: string, label?: string}>} available
 */
export function runValueFor(key, available) {
  return (available ?? []).find((v) => same(v.name, key)) ?? null;
}

/**
 * @param {Object} entry
 * @param {Object} values
 */
export function withPlaceholderValues(entry, values) {
  const rest = { ...(entry ?? {}) };
  delete rest.placeholderValues;
  return Object.keys(values ?? {}).length > 0 ? { ...rest, placeholderValues: values } : rest;
}
