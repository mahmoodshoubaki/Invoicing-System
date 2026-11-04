export function unknownTypeErrors(block, where, keys) {
  if (!block || !keys) return [];
  return Object.entries(block)
    .filter(([, entry]) => entry?.typeKey != null && !keys.has(entry.typeKey))
    .map(([name, entry]) => `${where} picks notification type ${entry.typeKey} for "${name}", which does not exist or was deleted.`);
}
