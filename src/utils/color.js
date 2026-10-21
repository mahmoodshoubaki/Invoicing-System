/**
 * Colour helpers for author-supplied hex values.
 *
 * Workflow outcome buttons carry a `colorHex` chosen by whoever drew the
 * workflow. We render it literally — that is the contract — but we still have
 * to put readable text on top of whatever they picked, which nothing in the
 * design system can predict.
 */

/**
 * Parses `#rgb` or `#rrggbb` into components. Returns null for anything else,
 * including the null a workflow author leaves when they pick no colour.
 *
 * @param {string|null|undefined} hex
 * @returns {{r: number, g: number, b: number}|null}
 */
export function parseHex(hex) {
  if (typeof hex !== 'string') return null;

  const cleaned = hex.trim().replace(/^#/, '');
  const expanded =
    cleaned.length === 3
      ? cleaned.split('').map((c) => c + c).join('')
      : cleaned;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) return null;

  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
}

/**
 * Relative luminance per WCAG 2.x — the sRGB channels are linearised before
 * being weighted, which is why this is not a plain average. A mid green and a
 * mid blue of the same "brightness" by eye differ by a lot here, and that
 * difference is exactly what decides whether white text is legible.
 *
 * @param {string} hex
 * @returns {number} 0 (black) … 1 (white), or 1 when the colour is unparseable
 */
export function luminance(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return 1;

  const channel = (value) => {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/**
 * Picks black or white text for a background, whichever contrasts more.
 *
 * The 0.45 threshold sits slightly below the midpoint on purpose: white text
 * on a mid-tone needs more headroom than black does, so the tie is broken
 * toward the darker foreground.
 *
 * @param {string|null|undefined} backgroundHex
 * @param {string} [fallback]  used when the colour cannot be parsed
 * @returns {string}
 */
export function readableTextOn(backgroundHex, fallback = '#0b0b0b') {
  if (!parseHex(backgroundHex)) return fallback;
  return luminance(backgroundHex) > 0.45 ? '#0b0b0b' : '#ffffff';
}

/**
 * `rgba()` string from a hex plus an alpha — for tinted backgrounds and rings
 * that have to sit on an author-chosen colour without a second hex from them.
 *
 * @param {string|null|undefined} hex
 * @param {number} alpha  0…1
 * @param {string} [fallback]
 * @returns {string}
 */
export function withAlpha(hex, alpha, fallback = 'transparent') {
  const rgb = parseHex(hex);
  if (!rgb) return fallback;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
