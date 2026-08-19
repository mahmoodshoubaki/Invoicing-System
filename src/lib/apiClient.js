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
 */
export class ApiError extends Error {
  constructor(message, { code = null, traceId = null, status = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.traceId = traceId;
    this.status = status;
  }
}

async function parseErrorResponse(res) {
  const raw = await res.text().catch(() => '');
  const fallback = res.statusText || `Request failed with status ${res.status}`;
  if (!raw) return { message: fallback };

  try {
    const data = JSON.parse(raw);
    return {
      message: data.Message || data.message || fallback,
      code: data.ErrorCode || data.errorCode || null,
      traceId: data.TraceId || data.traceId || null,
    };
  } catch {
    return { message: raw };
  }
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

async function request(url, { method = 'GET', body, headers = {}, skipRefresh = false, _retry = false, ...rest } = {}) {
  // FormData bodies (e.g. file uploads) must go through untouched — the
  // browser sets its own multipart Content-Type with the boundary
  // parameter, which a hardcoded 'application/json' would clobber, and
  // JSON.stringify-ing a FormData instance would just serialize it to '{}'.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: 'include',
      headers: isFormData ? headers : { 'Content-Type': 'application/json', ...headers },
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
      ...rest,
    });
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.');
  }

  // Access token expired — refresh once and retry the original request.
  // The user never sees this: no toast, no redirect, just a brief pause.
  if (res.status === 401 && !skipRefresh && !_retry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request(url, { method, body, headers, skipRefresh, _retry: true, ...rest });
    }
    handleSessionExpired();
    throw new ApiError('Your session has expired. Please sign in again.', { status: 401 });
  }

  if (!res.ok) {
    const { message, code, traceId } = await parseErrorResponse(res);
    throw new ApiError(message, { code, traceId, status: res.status });
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
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

  if (res.status === 401 && !_retry) {
    const refreshed = await refreshSession();
    if (refreshed) return downloadFile(url, fallbackFileName, true);
    handleSessionExpired();
    throw new ApiError('Your session has expired. Please sign in again.', { status: 401 });
  }

  if (!res.ok) {
    const { message, code, traceId } = await parseErrorResponse(res);
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
