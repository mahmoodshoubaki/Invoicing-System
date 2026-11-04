/**
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
 * @param {string} hex
 * @returns {number}
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
 * @param {string|null|undefined} backgroundHex
 * @param {string} [fallback]
 * @returns {string}
 */
export function readableTextOn(backgroundHex, fallback = '#0b0b0b') {
  if (!parseHex(backgroundHex)) return fallback;
  return luminance(backgroundHex) > 0.45 ? '#0b0b0b' : '#ffffff';
}

/**
 * @param {string|null|undefined} hex
 * @param {number} alpha
 * @param {string} [fallback]
 * @returns {string}
 */
export function withAlpha(hex, alpha, fallback = 'transparent') {
  const rgb = parseHex(hex);
  if (!rgb) return fallback;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
