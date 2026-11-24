/**
 * @param {(key: string) => string} t translator for the `dashboard` namespace
 * @param {{ status: string }} source
 * @param {string} readyNote
 * @param {string} [forbiddenNote]
 */
export function sourceNote(t, source, readyNote, forbiddenNote) {
  if (source.status === 'loading') return t('source.loading');
  if (source.status === 'forbidden') return forbiddenNote ?? t('source.forbidden');
  if (source.status === 'error') return t('source.error');
  return readyNote;
}
