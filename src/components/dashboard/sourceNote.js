/** What a figure says under itself while its source is not ready. */
export function sourceNote(source, readyNote, forbiddenNote = 'No access') {
  if (source.status === 'loading') return 'Loading…';
  if (source.status === 'forbidden') return forbiddenNote;
  if (source.status === 'error') return 'Could not be loaded';
  return readyNote;
}

export const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
