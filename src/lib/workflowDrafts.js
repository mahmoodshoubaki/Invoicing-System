export function draftRowOf(versions) {
  return (versions ?? []).find((v) => v.isDraft) ?? null;
}

export function nextVersionNumber(versions) {
  return (versions ?? []).reduce((max, v) => (v.version != null && v.version > max ? v.version : max), 0) + 1;
}

/**
 * @param {{ code: string|null, isDraft: boolean, stamp: number|null }} state
 * @param {Array} versions
 * @returns {{ stamp: number|null, replaces: Object|null }}
 */
export function saveTarget(state, versions) {
  if (!state.code) return { stamp: null, replaces: null };
  if (state.isDraft) return { stamp: state.stamp ?? null, replaces: null };
  const draft = draftRowOf(versions);
  return { stamp: draft?.stamp ?? null, replaces: draft };
}

export function draftIdOf(state, versions) {
  if (state.isDraft) return state.id ?? null;
  return draftRowOf(versions)?.definitionId ?? null;
}

export function hasPublishedOrSavedVersions(versions) {
  return (versions ?? []).some((v) => !v.isDraft);
}

/**
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
