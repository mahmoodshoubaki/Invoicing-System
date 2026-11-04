export function hostProblem(raw) {
  const host = String(raw ?? '').trim();
  if (!host) return 'Needs a host.';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(host)) return 'Just the host — no https:// in front.';
  if (host.includes('/')) return 'Just the host — no path after it.';
  if (host.includes(':')) return 'Just the host — no port.';
  if (host.includes(' ')) return 'A host has no spaces in it.';
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(host)) {
    return 'That does not look like a host name.';
  }
  return null;
}
