/**
 * The draft rules (2026-10-11), as the backend enforces them.
 *
 * A workflow has at most ONE draft. Saving writes it — creating it when there
 * is none — and never makes a version; publishing turns it into the next
 * version and makes that live. Every save sends the draft's stamp as it was
 * read (null when there was no draft); a different one is 409 WF-052.
 *
 * Opening an older version and saving it is how editing starts again from
 * that version: it BECOMES the draft. If a draft already exists, that one is
 * replaced — so the save has to send the existing draft's stamp, and the
 * author should be told before it happens.
 */

/** The draft's row in GetDefinitionVersions (listed first), or null. */
export function draftRowOf(versions) {
  return (versions ?? []).find((v) => v.isDraft) ?? null;
}

/** The number the next publish takes: one above the highest numbered version. */
export function nextVersionNumber(versions) {
  return (versions ?? []).reduce((max, v) => (v.version != null && v.version > max ? v.version : max), 0) + 1;
}

/**
 * What saving the open document sends as its stamp, and which existing draft
 * (if any) it replaces without having been opened from it.
 *
 * @param {{ code: string|null, isDraft: boolean, stamp: number|null }} state
 * @param {Array} versions  GetDefinitionVersions rows
 * @returns {{ stamp: number|null, replaces: Object|null }}
 */
export function saveTarget(state, versions) {
  if (!state.code) return { stamp: null, replaces: null };
  if (state.isDraft) return { stamp: state.stamp ?? null, replaces: null };
  const draft = draftRowOf(versions);
  return { stamp: draft?.stamp ?? null, replaces: draft };
}

/** The draft's id — the open document's when it is the draft, else the versions list's. */
export function draftIdOf(state, versions) {
  if (state.isDraft) return state.id ?? null;
  return draftRowOf(versions)?.definitionId ?? null;
}

/** Whether a workflow has numbered versions besides its draft — discarding a draft-only one deletes it. */
export function hasPublishedOrSavedVersions(versions) {
  return (versions ?? []).some((v) => !v.isDraft);
}

/**
 * What the builder needs to know about the open document against the version
 * list. Whether it is live is read off the version ROWS, which are refetched
 * after anything goes live — the open document's own `isActive` is only as
 * fresh as the last load, and stands in until the rows arrive.
 *
 * @returns {{ openVersion: Object|null, liveVersion: Object|null, openIsActive: boolean, nextVersion: number }}
 */
export function versionFacts(state, versions) {
  const openVersion = state.isDraft
    ? null
    : (versions ?? []).find((v) => !v.isDraft && v.version === state.version) ?? null;
  return {
    openVersion,
    liveVersion: (versions ?? []).find((v) => v.isActive) ?? null,
    openIsActive: openVersion ? openVersion.isActive : Boolean(state.isActive && !state.isDraft),
    nextVersion: nextVersionNumber(versions),
  };
}
