export const INTERNAL_API_ORIGIN = '{{secrets.InternalApi}}';
export const INTERNAL_API_PREFIX = `${INTERNAL_API_ORIGIN}/`;
export const INTERNAL_API_LABEL = 'This system’s API';

export function isInternalApiUrl(url) {
  return typeof url === 'string' && url.startsWith(INTERNAL_API_PREFIX);
}

export function hostnameOf(url) {
  const raw = typeof url === 'string' ? url.trim() : '';
  const match = /^https?:\/\/([^/?#]*)/i.exec(raw);
  if (!match) return null;

  if (match[1].includes('{{')) return null;

  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function normalizeHost(host) {
  return String(host ?? '').trim().toLowerCase();
}

/**
 * @returns {{scheme: string|null, host: string, rest: string}|null}
 */
export function splitUrl(url) {
  const raw = typeof url === 'string' ? url.trim() : '';

  // An empty field is the ordinary starting state, not an unsplittable one.
  if (!raw) return { scheme: 'https', host: '', rest: '' };

  if (raw.startsWith(INTERNAL_API_PREFIX)) {
    return { scheme: null, host: INTERNAL_API_ORIGIN, rest: raw.slice(INTERNAL_API_ORIGIN.length) };
  }

  const match = /^(https?):\/\/([^/?#]*)/i.exec(raw);
  if (!match) return null;

  const [origin, scheme, host] = match;

  // No host to choose from the dropdown, so this one stays a free-text box.
  if (!host || host.includes('{{')) return null;

  return {
    scheme: scheme.toLowerCase(),
    host,
    rest: raw.slice(origin.length),
  };
}

export function buildUrl(parts, patch = {}) {
  const { scheme, host = '', rest = '' } = { ...parts, ...patch };
  if (!host) return '';

  if (host === INTERNAL_API_ORIGIN) {
    return `${INTERNAL_API_ORIGIN}${rest.startsWith('/') ? rest : `/${rest}`}`;
  }

  const needsSlash = rest && !/^[/?#]/.test(rest);
  return `${scheme ?? 'https'}://${host}${needsSlash ? '/' : ''}${rest}`;
}
