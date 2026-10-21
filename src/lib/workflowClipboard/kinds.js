/** What the clipboard can hold, and how it holds it. */

export const CLIP_KIND = { STAGE: 'stage', STEP: 'step' };

/**
 * Copy pastes duplicates; cut pastes the originals somewhere else.
 *
 * A copy holds a snapshot of what was copied. A cut holds only ids: the
 * originals stay where they are — faded — until the paste moves whatever they
 * are by then, edits included. Cutting removes nothing, so a cut never pasted
 * loses nothing either.
 */
export const CLIP_MODE = { COPY: 'copy', CUT: 'cut' };
