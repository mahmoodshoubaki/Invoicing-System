/**
 * Reading and writing an `http.call` URL as two controls: a host to choose and
 * a path to type.
 *
 * The host is picked rather than typed, because a call to an unapproved host
 * saves perfectly happily and then fails at run time — surfacing on the
 * monitoring page, later, to somebody who was not the author.
 *
 * Splitting is the risky half: a URL already saved must come back out of these
 * two controls byte-identical, or editing an unrelated header would silently
 * rewrite somebody's endpoint.
 */

/**
 * This system's own API, as the start of an address.
 *
 * The server fills `{{secrets.InternalApi}}` in from its own configuration —
 * `https://localhost:7135` in development, the real host in production — so a
 * workflow calling this application does not bake one environment's address
 * into its definition, and moves between environments unchanged.
 *
 * **It is the ONLY placeholder allowed to begin an address, and only in exactly
 * this form, slash included.** Every other `{{…}}` at the start of a URL is
 * refused: a placeholder there decides where a request is sent, and letting any
 * name do that would let a credential's value become a destination.
 *
 * The allowlist still applies. The server checks the host this resolves to, so
 * that host — `localhost` for the development value — has to be approved.
 */
export const INTERNAL_API_ORIGIN = '{{secrets.InternalApi}}';
export const INTERNAL_API_PREFIX = `${INTERNAL_API_ORIGIN}/`;
export const INTERNAL_API_LABEL = 'This system’s API';

/** Whether an address starts with exactly `{{secrets.InternalApi}}/`. */
export function isInternalApiUrl(url) {
  return typeof url === 'string' && url.startsWith(INTERNAL_API_PREFIX);
}

/**
 * The hostname the server compares against the approved list.
 *
 * Mirrors the backend exactly: the hostname out of the URL, lowercased, with
 * the port ignored — `https://LocalHost:7135/api/x` is `localhost`. The approved
 * list stores bare hosts, so comparing anything that still carried the port
 * would call `localhost:7135` unapproved when `localhost` is on the list.
 *
 * Null when there is no hostname to read: an empty field, a relative path, or an
 * address whose origin is a placeholder resolved only at run time.
 */
export function hostnameOf(url) {
  const raw = typeof url === 'string' ? url.trim() : '';
  const match = /^https?:\/\/([^/?#]*)/i.exec(raw);
  if (!match) return null;

  // A placeholder in the authority has no hostname until the run fills it in,
  // and that resolved value is what the server compares. The URL parser does
  // not refuse braces in a host — it would hand back `{{host}}` — so this is
  // checked before parsing rather than trusted to it.
  if (match[1].includes('{{')) return null;

  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** An approved host as stored, in the form `hostnameOf` returns. */
export function normalizeHost(host) {
  return String(host ?? '').trim().toLowerCase();
}

/**
 * A URL as the editor works on it, or `null` when it cannot be split.
 *
 * Null is not a failure — it means "leave this as one free-text box". A URL
 * whose origin is some OTHER placeholder has no host to choose, and forcing it
 * through a host dropdown would destroy it.
 *
 * `host` is the authority exactly as typed — case and port included — because
 * rebuilding from it must reproduce the saved text byte for byte. Comparison
 * against the approved list uses `hostnameOf` instead, never this.
 *
 * This system's API comes back with `host` set to `INTERNAL_API_ORIGIN` and
 * `scheme` null: there is no scheme to keep, the origin supplies its own.
 *
 * @returns {{scheme: string|null, host: string, rest: string}|null}
 */
export function splitUrl(url) {
  const raw = typeof url === 'string' ? url.trim() : '';

  // An empty field is the ordinary starting state, not an unsplittable one.
  if (!raw) return { scheme: 'https', host: '', rest: '' };

  // Everything after the origin, slash included, so rebuilding is a plain join
  // and `{{secrets.InternalApi}}/api/Invoices/MarkInvoiced` comes back as itself.
  if (raw.startsWith(INTERNAL_API_PREFIX)) {
    return { scheme: null, host: INTERNAL_API_ORIGIN, rest: raw.slice(INTERNAL_API_ORIGIN.length) };
  }

  /*
   * Sliced off the raw string rather than read back out of `new URL()`.
   *
   * URL re-serialises what it parses, and percent-encodes braces on the way:
   * `/v1/{{invoiceNumber}}` comes back as `/v1/%7B%7BinvoiceNumber%7D%7D`. That
   * still resolves, but it would rewrite the author's URL the moment they
   * edited an unrelated header — a silent change to something they never
   * touched. Slicing keeps every byte they typed.
   */
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

/**
 * Puts one back together, keeping whichever half is not being changed.
 *
 * With no host there is no URL at all — returning a bare scheme would be a
 * value the author never chose and the server would refuse.
 *
 * This system's API always keeps its slash, even with nothing typed after it:
 * `{{secrets.InternalApi}}` alone is not the allowed start, so an empty or
 * query-only path is written as `{{secrets.InternalApi}}/…` rather than refused.
 */
export function buildUrl(parts, patch = {}) {
  const { scheme, host = '', rest = '' } = { ...parts, ...patch };
  if (!host) return '';

  if (host === INTERNAL_API_ORIGIN) {
    return `${INTERNAL_API_ORIGIN}${rest.startsWith('/') ? rest : `/${rest}`}`;
  }

  const needsSlash = rest && !/^[/?#]/.test(rest);
  // `scheme` is null when switching away from this system's API.
  return `${scheme ?? 'https'}://${host}${needsSlash ? '/' : ''}${rest}`;
}
