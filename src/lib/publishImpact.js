/**
 * What publishing a version will do to workflows that are already running.
 *
 * The rule, as the backend enforces it (2026-09-14):
 *
 * - **A successful publish moves EVERY running workflow onto the new version** —
 *   from whichever version each one is on, not only the live one.
 * - It is **refused (409 WF-024)** if any running workflow is standing in a stage
 *   where more changed than a stage title or a Call API step's inputs (url,
 *   method, body, contentType, header.*). Then the old version stays live and
 *   nothing moves. There is no partial outcome.
 *
 * Deliberately NOT predicted here: whether a particular publish will be refused.
 * That needs the backend's own "which stages differ" comparison, and a copy of it
 * in the front end would drift the first time the backend's changed. The refusal
 * comes back with the server's message and the dialog shows it.
 */

/**
 * The versions holding running workflows that a publish of `publishing` moves.
 *
 * Every version is considered — the first version of this check looked only at
 * the live one, so workflows running on any other version never raised the
 * warning at all. The version being published is excluded: workflows already on
 * it have nowhere to move.
 */
export function versionsWithRunsToMove(versions, publishing) {
  return (versions ?? []).filter(
    (v) => v?.hasRunningInstances === true && v.version !== publishing?.version
  );
}

/** "version 2", "versions 1 and 2", "versions 1, 2 and 3". */
export function describeVersions(list) {
  const numbers = (list ?? []).map((v) => v.version).sort((a, b) => a - b);
  if (numbers.length === 0) return '';
  if (numbers.length === 1) return `version ${numbers[0]}`;
  return `versions ${numbers.slice(0, -1).join(', ')} and ${numbers.at(-1)}`;
}

/**
 * The second line of the "version is live" message — said as a fact, because a
 * successful publish always moved them. There is nothing to check afterwards.
 */
export function publishedMessage(runsMoved) {
  return runsMoved
    ? 'Running workflows moved onto it.'
    : 'New runs will follow it.';
}
