/**
 * The calm, warm-neutral look the workflow screens already use, as tokens, so
 * every new page (notifications, jobs, audit, trace) reads as the same app.
 *
 * Eye comfort is the brief: off-white surfaces instead of pure white blocks,
 * hairline warm borders instead of grey boxes, colour only where it carries a
 * meaning (a status), and always at a low alpha behind dark text.
 */

export const SURFACE = {
  page: '#fbfaf9',
  raised: '#ffffff',
  sunken: '#f6f5f3',
  hover: '#f1f0ee',
};

export const BORDER = {
  hairline: '#f1f0ee',
  soft: '#eceae4',
  strong: '#e1e0d9',
};

/** One look for every small form control on the admin pages. */
export const controlClass =
  'rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none transition-colors focus:border-primary disabled:bg-[#fbfaf9] disabled:text-gray-400';

export const labelClass = 'mb-1 block text-[11px] font-medium';
