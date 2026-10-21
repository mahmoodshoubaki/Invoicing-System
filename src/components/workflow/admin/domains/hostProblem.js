/**
 * Why a host will not be accepted — checked here so WF-032 is never the way
 * somebody finds out.
 *
 * The endpoint wants a BARE host: no scheme, no path, no port. That is an easy
 * thing to get wrong, because every other place a host appears in this app it
 * is part of a URL.
 */
export function hostProblem(raw) {
  const host = String(raw ?? '').trim();
  if (!host) return 'Needs a host.';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(host)) return 'Just the host — no https:// in front.';
  if (host.includes('/')) return 'Just the host — no path after it.';
  if (host.includes(':')) return 'Just the host — no port.';
  if (host.includes(' ')) return 'A host has no spaces in it.';
  // One or more labels, so a dotless host like `localhost` is accepted. The
  // backend takes any bare host name with or without a dot — requiring one was a
  // front-end rule only, and it blocked approving this system's own development
  // host while letting `127.0.0.1` through, which does not match `InternalApi`.
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(host)) {
    return 'That does not look like a host name.';
  }
  return null;
}
