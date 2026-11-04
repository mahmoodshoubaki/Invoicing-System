export function versionsWithRunsToMove(versions, publishing) {
  return (versions ?? []).filter(
    (v) => v?.hasRunningInstances === true && v.version !== publishing?.version
  );
}

export function describeVersions(list) {
  const numbers = (list ?? []).map((v) => v.version).sort((a, b) => a - b);
  if (numbers.length === 0) return '';
  if (numbers.length === 1) return `version ${numbers[0]}`;
  return `versions ${numbers.slice(0, -1).join(', ')} and ${numbers.at(-1)}`;
}

export function publishedMessage(runsMoved) {
  return runsMoved
    ? 'Running workflows moved onto it.'
    : 'New runs will follow it.';
}
