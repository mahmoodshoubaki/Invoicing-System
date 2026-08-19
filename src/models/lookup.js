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
    colorHex: raw.colorHex ?? '#6b7280',
  };
}

/**
 * Maps a raw invoice status lookup entry { key, value, colorHex } to a
 * LookupItem with its display color attached — unlike other lookups, invoice
 * statuses carry their own color from the API.
 *
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
 * Maps a raw BOQ item status lookup entry { key, value, colorHex } to a
 * LookupItem with its display color attached.
 *
 * Kept as its own function rather than reusing createInvoiceStatus even
 * though the shape is identical today — the two lookups are independent on
 * the backend and may diverge later.
 *
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
 * Maps a raw tracker cycle status lookup entry { key, value, colorHex } to a
 * LookupItem with its display color attached — same shape as
 * createBoqItemStatus/createInvoiceStatus, kept separate since this lookup
 * (GetTrackerCycleStatuses) is independent on the backend.
 *
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
