/**
 * @typedef {Object} LookupItem
 * @property {number} id
 * @property {string} label
 */

/**
 * @typedef {Object} StatusLookup
 * @property {number} id
 * @property {string|null} labelEn
 * @property {string|null} labelAr
 * @property {string} colorHex
 */

/**
 * @param {Object} raw
 * @returns {LookupItem}
 */
export function createLookupItem(raw) {
  return {
    id:    raw.key,
    label: raw.value ?? '',
    colorHex: raw.colorHex ?? '#6b7280',
  };
}

/**
 * @param {Object} raw
 * @returns {StatusLookup}
 */
function createStatusLookup(raw) {
  return {
    id:       raw.key,
    labelEn:  raw.valueEN ?? null,
    labelAr:  raw.valueAR ?? null,
    colorHex: raw.colorHex ?? '#6b7280',
  };
}

export const createInvoiceStatus = createStatusLookup;
export const createBoqItemStatus = createStatusLookup;
export const createTrackerCycleStatus = createStatusLookup;
