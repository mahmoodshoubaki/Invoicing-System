/** Shared by the definition's and a human task's notification checks. */

/**
 * Every type a notification block picks that the type list does not have —
 * the save's WF-050. `keys` null means the list could not be read (no
 * Notifications.View), and then nothing is judged here; the server still is.
 */
export function unknownTypeErrors(block, where, keys) {
  if (!block || !keys) return [];
  return Object.entries(block)
    .filter(([, entry]) => entry?.typeKey != null && !keys.has(entry.typeKey))
    .map(([name, entry]) => `${where} picks notification type ${entry.typeKey} for "${name}", which does not exist or was deleted.`);
}
