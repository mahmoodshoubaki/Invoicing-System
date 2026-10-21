/**
 * Slugs for workflow stage and step ids.
 *
 * These ids are not cosmetic. They are written into the saved definition, they
 * are what transitions point at, and the engine reports them back in
 * `currentStageId`, `currentStepId`, `failureReason` and a parallel step's
 * `branches` map. A readable id is the difference between a run that says
 * "waiting at qs-review" and one that says "waiting at stg_8f3a2c".
 */

/**
 * "QS Review" → "qs-review". Strips accents, collapses anything that is not a
 * letter, digit or hyphen, and trims stray hyphens from the ends.
 *
 * @param {string} value
 * @returns {string} possibly empty, if `value` had nothing slug-worthy in it
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
 * Sanitises an id **while it is being typed**, which is not the same job as
 * `slugify`.
 *
 * `slugify` trims trailing hyphens, so running it on every keystroke makes the
 * field unusable: typing "qs " gives "qs", and the next character lands as
 * "qsr" instead of "qs-r". This keeps a single trailing hyphen so a space can
 * become the separator the author clearly intended, and defers the trimming to
 * `slugify` on blur.
 *
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
 * Why an id is not usable, or null when it is fine. Mirrors what the backend
 * would reject, so nobody learns these from a failed save.
 *
 * @param {string} id
 * @param {Iterable<string>} takenByOthers  every other id in the definition
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
 * A slug guaranteed not to collide with `taken`, by appending -2, -3, …
 *
 * Step ids must be unique across the ENTIRE definition — branches included —
 * not merely within their stage, so callers must pass every id in the
 * definition, not just the neighbouring ones.
 *
 * @param {string} desired
 * @param {Iterable<string>} taken
 * @param {string} [fallback] used when `desired` slugifies to nothing
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
