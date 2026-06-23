import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS class names with conflict resolution.
 * Combines clsx (conditional class logic) with tailwind-merge (deduplication).
 *
 * @param {...(string|string[]|Record<string,boolean>|undefined|null|false)} inputs
 * @returns {string}
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary', 'px-6')
 * // => 'py-2 bg-primary px-6' (px-4 is overridden by px-6)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
