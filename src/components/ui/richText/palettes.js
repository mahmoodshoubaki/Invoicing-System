/** The colours and sizes the toolbar offers. */

/** Brand-safe text colours: all readable on white. */
export const TEXT_COLORS = ['#3c3c3a', '#6b6a66', '#f8485e', '#c0392f', '#c2410c', '#1f8a3b', '#0f7b8a', '#2563eb', '#6d28d9', '#a21caf'];

/** Soft fills behind text. */
export const FILL_COLORS = ['#fde2e5', '#ffedd5', '#fef3c7', '#dcfce7', '#cffafe', '#dbeafe', '#ede9fe', '#f1f0ee'];

export const SIZES = [
  { value: '12px', label: 'Small' },
  { value: '', label: 'Normal' },
  { value: '18px', label: 'Large' },
  { value: '24px', label: 'Huge' },
];

/** `#rrggbb` for the colour input, which accepts nothing else; null when it is not a colour we can read. */
export function toHex(color) {
  if (!color) return null;
  const c = color.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(c)) return c;
  if (/^#[0-9a-f]{3}$/.test(c)) return `#${[...c.slice(1)].map((d) => d + d).join('')}`;
  const rgb = c.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return rgb ? `#${rgb.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('')}` : null;
}
