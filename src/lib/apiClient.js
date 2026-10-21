// Same-origin as the app itself — see src/app/api/backend/[...path]/route.js.
// The browser never talks to the real backend directly, so its auth cookies
// are always first-party here regardless of what origin the backend is on.
const BASE_URL = '/api/backend';

/**
 * Error shape returned by the backend on failure:
 *   { "ErrorCode": "BOQ-002", "Message": "...", "TraceId": "..." }
 *
 * `message` is always the human-readable text meant for the user (falls back
 * gracefully if the backend ever returns something else). `code`/`traceId`/
 * `status` are kept on the instance for callers that need to branch on a
 * specific failure (e.g. treating a 404 as "not found yet" instead of an error).
 *
 * `traceId` is the request's **tracking number** (2026-10-07): the same value
 * as the `X-Correlation-Id` header, and what support types into the trace page
 * to see everything the action caused. `errors` is the per-field list a
 * validation failure (400) carries.
 */
export class ApiError extends Error {
  constructor(message, { code = null, traceId = null, status = null, errors = null, body = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.traceId = traceId;
    this.status = status;
    this.errors = errors;
    // The whole parsed error body, for refusals that carry more than a message
    // — a publish refused with its `Problems`, or with the `BlockedRuns` that
    // stopped it. PascalCase, like every error body.
    this.body = body;
  }
}

async function parseErrorResponse(res) {
  const raw = await res.text().catch(() => '');
  const fallback = res.statusText || `Request failed with status ${res.status}`;
  // The header carries the tracking number even when the body does not.
  const headerTrace = res.headers?.get?.(CORRELATION_HEADER) ?? null;
  if (!raw) return { message: fallback, traceId: headerTrace };

  try {
    const data = JSON.parse(raw);
    return {
      message: data.Message || data.message || fallback,
      code: data.ErrorCode || data.errorCode || null,
      traceId: data.TraceId || data.traceId || headerTrace,
      errors: data.Errors || data.errors || null,
      body: data && typeof data === 'object' ? data : null,
    };
  } catch {
    return { message: raw, traceId: headerTrace };
  }
}

// ---------------------------------------------------------------------------
// Tracking number
//
// Every response carries `X-Correlation-Id`: the number tying together what one
// user action caused — the run it started, the task it made, the email a
// minute later. The server accepts ours (8–64 letters, digits or dashes) and
// makes one up otherwise.
//
// One is minted per CHANGE (anything but GET) — a click that saves is one
// action, and that call is what the trace page is asked about. A caller doing
// several calls for one click can pass the same `correlationId` to each.
// ---------------------------------------------------------------------------

const CORRELATION_HEADER = 'X-Correlation-Id';

export function newCorrelationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Insecure contexts have no randomUUID; this only has to be unique enough to
  // find one action again, and the server checks nothing but its shape.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// ---------------------------------------------------------------------------
// Silent token refresh
//
// Both the access and refresh tokens are httpOnly cookies now — the frontend
// never sees either. Every request just needs credentials: 'include' so the
// browser attaches them automatically; there's no header for us to set and
// no token to store. On a 401 we ask api/auth/Refresh to mint a fresh
// access-token cookie (again, invisible to us — we only care whether it
// succeeded) and retry the original request once. Concurrent 401s all await
// the same in-flight refresh instead of firing one Refresh call each.
// ---------------------------------------------------------------------------

let refreshPromise = null;

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/Refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          console.error(`[apiClient] Refresh failed: HTTP ${res.status} ${res.statusText}`);
          return false;
        }
        return true;
      } catch (err) {
        // Almost always a network-level failure — most commonly a blocked CORS
        // preflight, which never reaches the backend at all (so it won't show
        // up in server-side logs/breakpoints, only here and in the Network tab).
        console.error('[apiClient] Refresh request threw before getting a response (check the Network tab for a CORS/preflight failure on /api/auth/Refresh):', err);
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

/** Session is unrecoverable — send the user back to login. */
function handleSessionExpired() {
  if (typeof window === 'undefined' || window.location.pathname === '/login') return;
  const redirect = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/login?redirect=${redirect}`;
}

/**
 * The account was switched off while the session was open.
 *
 * Role and permission changes now take effect on the user's next request rather
 * than at the next login, so this can surface mid-session on any endpoint — not
 * just at a natural boundary. It is NOT an expired token: refreshing would mint
 * a fresh credential for an account that cannot use it, so that path is skipped
 * entirely.
 */
const ACCOUNT_DISABLED_CODE = 'IDT-014';

async function handleAccountDisabled() {
  // Drop the httpOnly cookies server-side so the browser is not left holding a
  // credential for a dead account. Best-effort and deliberately not routed
  // through request(): it must never refresh, never retry, and never block the
  // redirect if it fails. The hard navigation below discards the in-memory
  // React and Redux state on its own.
  try {
    await fetch(`${BASE_URL}/api/auth/Logout`, { method: 'POST', credentials: 'include' });
  } catch {
    // Getting the user out matters more than the tidy-up.
  }
  handleSessionExpired();
}

/*
 * An expired or missing token is a 401 with IDT-003 on EVERY endpoint.
 *
 * It was not always: until 2026-10-01 the permission-guarded endpoints
 * (SaveDefinition, GetDefinitions, GetFields…) answered an expired token with a
 * 500, because the backend's permission handler threw instead of refusing. A
 * workflow built over more than the token's 60 minutes then could not be saved
 * until the page was reloaded. The backend now refuses properly and writes the
 * IDT-003 body on every such 401, so a 401 is all this has to look for.
 *
 * Any 401 other than IDT-014 is refreshed, not only IDT-003: a 401 that somehow
 * arrived without its body would otherwise fail instead of refreshing once.
 */

async function request(url, {
  method = 'GET', body, headers = {}, skipRefresh = false, _retry = false, correlationId = null, ...rest
} = {}) {
  // FormData bodies (e.g. file uploads) must go through untouched — the
  // browser sets its own multipart Content-Type with the boundary
  // parameter, which a hardcoded 'application/json' would clobber, and
  // JSON.stringify-ing a FormData instance would just serialize it to '{}'.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  // Minted once and kept through the refresh-and-retry below, so the retried
  // call is the same action rather than a second one.
  const tracking = correlationId ?? (method === 'GET' ? null : newCorrelationId());
  const sentHeaders = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(tracking ? { [CORRELATION_HEADER]: tracking } : {}),
    ...headers,
  };

  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: 'include',
      headers: sentHeaders,
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
      ...rest,
    });
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.', { traceId: tracking });
  }

  if (res.ok) {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  // A 401 is two different things, and the body says which — so it is read
  // BEFORE deciding whether to refresh.
  const { message, code, traceId, errors, body: errorBody } = await parseErrorResponse(res);

  if (res.status === 401 && !skipRefresh) {
    // The account was switched off. No refresh: a new token would be just as
    // rejected, and retrying would spend a round-trip to learn that.
    if (code === ACCOUNT_DISABLED_CODE) {
      await handleAccountDisabled();
      throw new ApiError(message || 'Your account is no longer active. Please sign in again.', {
        code, traceId, status: 401,
      });
    }

    // Access token expired — refresh once and send the original request again.
    // The user never sees this: no toast, no redirect, just a brief pause.
    if (!_retry) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return request(url, {
          method, body, headers, skipRefresh, _retry: true, correlationId: tracking, ...rest,
        });
      }
      handleSessionExpired();
      throw new ApiError('Your session has expired. Please sign in again.', { status: 401 });
    }
  }

  // Anything else — including a refusal that survived a fresh token — is
  // surfaced as the backend worded it.
  throw new ApiError(message, { code, traceId: traceId ?? tracking, status: res.status, errors, body: errorBody });
}

/**
 * Extracts the filename from a Content-Disposition header, e.g.
 * `attachment; filename="Screenshot.png"` or the RFC 5987 `filename*=`
 * form. Falls back to the caller-supplied name if the header is missing
 * or unparsable.
 */
function filenameFromContentDisposition(header, fallback) {
  if (!header) return fallback;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) return decodeURIComponent(utf8Match[1]);
  const plainMatch = header.match(/filename="?([^";]+)"?/i);
  return plainMatch ? plainMatch[1] : fallback;
}

/**
 * Downloads a binary file (bypasses request()'s JSON parsing, which would
 * corrupt binary content). Shares the same credentials/silent-refresh
 * behavior so an expired access token doesn't just surface as a bare 401.
 *
 * @param {string} url
 * @param {string} fallbackFileName - used if the response has no
 *   Content-Disposition filename.
 * @param {boolean} [_retry]
 * @returns {Promise<{blob: Blob, fileName: string}>}
 */
async function downloadFile(url, fallbackFileName, _retry = false) {
  let res;
  try {
    res = await fetch(url, { credentials: 'include' });
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.');
  }

  // Same rules as request(): a switched-off account is not an expiry, and a
  // download must not sit refreshing a credential that cannot work.
  if (!res.ok) {
    const { message, code, traceId } = await parseErrorResponse(res);

    if (res.status === 401 && code === ACCOUNT_DISABLED_CODE) {
      await handleAccountDisabled();
      throw new ApiError(message || 'Your account is no longer active. Please sign in again.', {
        code, traceId, status: 401,
      });
    }

    if (res.status === 401 && !_retry) {
      const refreshed = await refreshSession();
      if (refreshed) return downloadFile(url, fallbackFileName, true);
      handleSessionExpired();
      throw new ApiError('Your session has expired. Please sign in again.', { status: 401 });
    }

    throw new ApiError(message, { code, traceId, status: res.status });
  }

  const blob = await res.blob();
  const fileName = filenameFromContentDisposition(res.headers.get('content-disposition'), fallbackFileName);
  return { blob, fileName };
}

/**
 * Creates a namespaced API client for a specific module prefix.
 * Example: createApiClient('/api/Projects') → all calls are scoped to that prefix.
 *
 * @param {string} prefix - URL segment appended after BASE_URL, e.g. '/api/Projects'
 */
export function createApiClient(prefix = '') {
  const base = `${BASE_URL}${prefix}`;
  return {
    get:      (path, params, opts)  => request(base + path + (params ? `?${new URLSearchParams(params)}` : ''), opts),
    post:     (path, body, opts)    => request(base + path, { method: 'POST', body, ...opts }),
    put:      (path, body, opts)    => request(base + path, { method: 'PUT', body, ...opts }),
    patch:    (path, body, opts)    => request(base + path, { method: 'PATCH', body, ...opts }),
    delete:   (path, opts)          => request(base + path, { method: 'DELETE', ...opts }),
    download: (path, params, fallbackFileName) =>
      downloadFile(base + path + (params ? `?${new URLSearchParams(params)}` : ''), fallbackFileName),
  };
}

export const apiClient = createApiClient();
