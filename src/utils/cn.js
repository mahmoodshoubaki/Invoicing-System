import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * @param {...(string|string[]|Record<string,boolean>|undefined|null|false)} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
