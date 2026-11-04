/**
 * @param {string} value
 * @returns {string}
 */
export function slugify(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * @param {string} value
 * @returns {string}
 */
export function sanitizeSlugInput(value) {
  const trailingSeparator = /[\s-]$/.test(String(value ?? ''));

  const core = String(value ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 60);

  return trailingSeparator && core.length > 0 && core.length < 60 ? `${core}-` : core;
}

/**
 * @param {string} id
 * @param {Iterable<string>} takenByOthers
 * @returns {string|null}
 */
export function validateSlug(id, takenByOthers = []) {
  const value = String(id ?? '');

  if (!value.trim()) return 'An id is required.';
  if (!/^[a-z0-9-]+$/.test(value)) return 'Use lowercase letters, numbers and hyphens only.';
  if (/^-|-$/.test(value)) return 'Cannot start or end with a hyphen.';
  if (/--/.test(value)) return 'Cannot contain two hyphens in a row.';
  if (value.length > 60) return 'Too long — 60 characters at most.';

  const taken = takenByOthers instanceof Set ? takenByOthers : new Set(takenByOthers);
  if (taken.has(value)) return 'Another stage or step already uses this id.';

  return null;
}

/**
 * @param {string} desired
 * @param {Iterable<string>} taken
 * @param {string} [fallback]
 * @returns {string}
 */
export function uniqueSlug(desired, taken, fallback = 'item') {
  const base = slugify(desired) || fallback;
  const used = taken instanceof Set ? taken : new Set(taken);

  if (!used.has(base)) return base;

  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
