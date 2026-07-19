/**
 * @typedef {Object} LookupItem
 * @property {number} id    - The numeric key from the API
 * @property {string} label - The human-readable display value
 */

/**
 * Maps a raw API lookup entry { key, value } to a LookupItem.
 *
 * @param {Object} raw
 * @returns {LookupItem}
 */
export function createLookupItem(raw) {
  return {
    id:    raw.key,
    label: raw.value ?? '',
  };
}
