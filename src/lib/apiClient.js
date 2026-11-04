import { withBasePath } from '@/constants/appConfig';
import { ROUTES } from '@/constants/routes';

const BASE_URL = withBasePath(ROUTES.BACKEND_PROXY);

export class ApiError extends Error {
  constructor(message, { code = null, traceId = null, status = null, errors = null, body = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.traceId = traceId;
    this.status = status;
    this.errors = errors;
    this.body = body;
  }
}

async function parseErrorResponse(res) {
  const raw = await res.text().catch(() => '');
  const fallback = res.statusText || `Request failed with status ${res.status}`;
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

const CORRELATION_HEADER = 'X-Correlation-Id';

export function newCorrelationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

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
        console.error('[apiClient] Refresh request threw before getting a response (check the Network tab for a CORS/preflight failure on /api/auth/Refresh):', err);
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

function handleSessionExpired() {
  if (typeof window === 'undefined' || window.location.pathname === withBasePath(ROUTES.LOGIN)) return;
  const redirect = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `${withBasePath(ROUTES.LOGIN)}?redirect=${redirect}`;
}

const ACCOUNT_DISABLED_CODE = 'IDT-014';

async function handleAccountDisabled() {
  try {
    await fetch(`${BASE_URL}/api/auth/Logout`, { method: 'POST', credentials: 'include' });
  } catch {
    // ignore
  }
  handleSessionExpired();
}

async function request(url, {
  method = 'GET', body, headers = {}, skipRefresh = false, _retry = false, correlationId = null, ...rest
} = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

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

  const { message, code, traceId, errors, body: errorBody } = await parseErrorResponse(res);

  if (res.status === 401 && !skipRefresh) {
    if (code === ACCOUNT_DISABLED_CODE) {
      await handleAccountDisabled();
      throw new ApiError(message || 'Your account is no longer active. Please sign in again.', {
        code, traceId, status: 401,
      });
    }

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

  throw new ApiError(message, { code, traceId: traceId ?? tracking, status: res.status, errors, body: errorBody });
}

function filenameFromContentDisposition(header, fallback) {
  if (!header) return fallback;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) return decodeURIComponent(utf8Match[1]);
  const plainMatch = header.match(/filename="?([^";]+)"?/i);
  return plainMatch ? plainMatch[1] : fallback;
}

/**
 * @param {string} url
 * @param {string} fallbackFileName
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
 * @param {string} prefix
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
