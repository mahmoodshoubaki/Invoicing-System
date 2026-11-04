/**
 * @typedef {Object} LookupItem
 * @property {number} id
 * @property {string} label
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
 * @returns {LookupItem & { colorHex: string }}
 */
export function createInvoiceStatus(raw) {
  return {
    id:       raw.key,
    label:    raw.value ?? '',
    colorHex: raw.colorHex ?? '#6b7280',
  };
}

/**
 * @param {Object} raw
 * @returns {LookupItem & { colorHex: string }}
 */
export function createBoqItemStatus(raw) {
  return {
    id:       raw.key,
    label:    raw.value ?? '',
    colorHex: raw.colorHex ?? '#6b7280',
  };
}

/**
 * @param {Object} raw
 * @returns {LookupItem & { colorHex: string }}
 */
export function createTrackerCycleStatus(raw) {
  return {
    id:       raw.key,
    label:    raw.value ?? '',
    colorHex: raw.colorHex ?? '#6b7280',
  };
}
